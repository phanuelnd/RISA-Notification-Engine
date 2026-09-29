from django.utils import timezone
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from notifications.models import (
    Notification,
    NotificationTemplate,
    Batch,
    UnsubscribedAddress
)

from services.models import GovernmentService
from notifications.serializers.serializers import (
    NotificationStatusSerializer,
    NotificationTemplateSerializer,
    BatchCreateSerializer,
    BatchStatusSerializer,
    UnsubscribeSerializer,
    NotificationListSerializer,
    TemplateListSerializer,
    DashboardAnalyticsSerializer
)
from notifications.tasks import process_batch_task
from Utils.custom_exceptions.format_error_message import format_errors
from Utils.custom_exceptions.api_exceptions import (
    ValidationException,
    ResourceNotFoundException,
    ServerException,
    AuthenticationException
)
from Utils.responses.api_responses import success_response
from Utils.authentication.permissions.api_key_permission import ApiKeyPermission


class NotificationStatusView(APIView):
    """
    API endpoint to get the status of a specific notification.
    Corresponds to: GET /notifications/{notification_id}
    """

    def get(self, request, notification_id):
        try:
            notification = Notification.objects.get(pk=notification_id)
            serializer = NotificationStatusSerializer(notification)
            return success_response(
                message="Notification status retrieved successfully",
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Notification.DoesNotExist:
            raise ResourceNotFoundException(resource_name="Notification")


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoints for listing and creating templates.
    Corresponds to: GET /templates and POST /templates
    """
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated]


class BatchCreateView(APIView):
    """
    API endpoint to create a new batch of notifications. This now handles all sending.
    Corresponds to: POST /batches
    """

    def post(self, request):
        serializer = BatchCreateSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationException(
                message="Invalid batch data",
                errors=serializer.errors
            )

        validated_data = serializer.validated_data

        try:
            # Look up the service and the template, ensuring the template is approved
            service = GovernmentService.objects.get(
                service_code=validated_data['service_code'])
            template = NotificationTemplate.objects.get(
                service=service,
                template_code=validated_data['template_code'],
                status=NotificationTemplate.Status.APPROVED
            )
        except GovernmentService.DoesNotExist:
            raise ResourceNotFoundException(resource_name="Service")
        except NotificationTemplate.DoesNotExist:
            raise ResourceNotFoundException(resource_name="Approved template")

        try:
            # Create the Batch object with the new fields
            batch = Batch.objects.create(
                service=service,
                batch_name=validated_data['batch_name'],
                notification_template=template,
                status='DRAFT',
                scheduled_at=validated_data.get('scheduled_at'),
                callback_url=validated_data.get('callback_url')
            )

            # Create the individual Notification objects
            notifications_to_create = [
                Notification(
                    service=service, batch=batch, notification_template=template,
                    recipient_address=recipient['address'], channel_type=template.channel_type,
                    variables=recipient['variables'], scheduled_at=validated_data.get(
                        'scheduled_at', timezone.now())
                ) for recipient in validated_data['recipients']
            ]

            Notification.objects.bulk_create(notifications_to_create)

            response_data = {
                "batch_id": batch.id,
                "status": batch.status,
                "estimated_recipients": len(notifications_to_create),
                "scheduled_at": batch.scheduled_at
            }
            return success_response(
                message="Batch created successfully",
                data=response_data,
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            raise ServerException(
                message="Failed to create batch",
                errors={'detail': str(e)}
            )


class BatchProcessView(APIView):
    """
    API endpoint to start the processing of a batch.
    """

    def post(self, request, batch_id):
        try:
            batch = Batch.objects.get(pk=batch_id)
            process_batch_task.delay(batch.id)

            response_data = {
                "batch_id": batch.id,
                "status": "PROCESSING"
            }
            return success_response(
                message="Batch processing started successfully",
                data=response_data,
                status_code=status.HTTP_200_OK
            )
        except Batch.DoesNotExist:
            raise ResourceNotFoundException(resource_name="Batch")


class BatchStatusView(APIView):
    """
    API endpoint to get the status of a specific batch.
    """

    def get(self, request, batch_id):
        try:
            batch = Batch.objects.get(pk=batch_id)
            serializer = BatchStatusSerializer(batch)
            return success_response(
                message="Batch status retrieved successfully",
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Batch.DoesNotExist:
            raise ResourceNotFoundException(resource_name="Batch")


class AnalyticsSummaryView(APIView):
    """
    API endpoint for service statistics.
    """

    def get(self, request):
        to_date_str = request.query_params.get(
            'to_date', datetime.now().strftime('%Y-%m-%d'))
        from_date_str = request.query_params.get(
            'from_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
        from_date = datetime.strptime(from_date_str, '%Y-%m-%d')
        to_date = datetime.strptime(to_date_str, '%Y-%m-%d')
        queryset = Notification.objects.filter(
            created_at__range=[from_date, to_date])
        stats = queryset.aggregate(
            total_sent=Count('id'), total_delivered=Count('id', filter=Q(status='DELIVERED')),
            total_failed=Count('id', filter=Q(status='FAILED')), total_cost=Sum('cost'),
            sms_sent=Count('id', filter=Q(channel_type='SMS')),
            sms_delivered=Count('id', filter=Q(
                channel_type='SMS', status='DELIVERED')),
            sms_failed=Count('id', filter=Q(channel_type='SMS', status='FAILED')), sms_cost=Sum('cost', filter=Q(channel_type='SMS')),
            email_sent=Count('id', filter=Q(channel_type='EMAIL')),
            email_delivered=Count('id', filter=Q(
                channel_type='EMAIL', status='DELIVERED')),
            email_failed=Count('id', filter=Q(channel_type='EMAIL', status='FAILED')), email_cost=Sum('cost', filter=Q(channel_type='EMAIL'))
        )
        success_rate = (stats['total_delivered'] / stats['total_sent']
                        * 100) if stats['total_sent'] > 0 else 0
        response_data = {
            "period": {"from": from_date_str, "to": to_date_str}, "total_sent": stats['total_sent'], "total_delivered": stats['total_delivered'],
            "total_failed": stats['total_failed'], "success_rate": round(success_rate, 2), "total_cost": stats['total_cost'] or 0.0,
            "by_channel": {"SMS": {"sent": stats['sms_sent'], "delivered": stats['sms_delivered'], "failed": stats['sms_failed'], "cost": stats['sms_cost'] or 0.0},
                           "EMAIL": {"sent": stats['email_sent'], "delivered": stats['email_delivered'], "failed": stats['email_failed'], "cost": stats['email_cost'] or 0.0}}
        }
        return Response(response_data)


class UnsubscribeView(APIView):
    """
    API endpoint to add an address to the unsubscribe list.
    """

    def post(self, request):
        serializer = UnsubscribeSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationException(
                message="Invalid unsubscribe data",
                errors=serializer.errors
            )

        serializer.save()
        return success_response(
            message="Address unsubscribed successfully",
            data=serializer.data,
            status_code=status.HTTP_201_CREATED
        )


class UnsubscribeCheckView(APIView):
    """
    API endpoint to check if an address is unsubscribed.
    """

    def get(self, request):
        address = request.query_params.get('address')
        if not address:
            raise ValidationException(
                message="Address query parameter is required",
                errors={'address': 'This query parameter is required'}
            )

        try:
            unsubscribed = UnsubscribedAddress.objects.get(address=address)
            response_data = {
                "is_unsubscribed": True,
                "unsubscribed_at": unsubscribed.created_at,
                "reason": unsubscribed.reason
            }
            return success_response(
                message="Address unsubscribe status retrieved successfully",
                data=response_data,
                status_code=status.HTTP_200_OK
            )
        except UnsubscribedAddress.DoesNotExist:
            return success_response(
                message="Address is not unsubscribed",
                data={"is_unsubscribed": False},
                status_code=status.HTTP_200_OK
            )


class TemplateViewList(APIView):
    """
    API endpoint to retrieve templates in the specified format
    """

    def get(self, request):
        templates = NotificationTemplate.objects.select_related(
            'created_by').all()
        serializer = TemplateListSerializer(templates, many=True)
        return success_response(
            message="Templates retrieved successfully",
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )


class DashboardAnalyticsView(APIView):
    """
    API endpoint to retrieve dashboard analytics data
    """

    def get(self, request):
        # Get all counts in single query
        notification_stats = Notification.objects.aggregate(
            total=Count('id'),
            delivered=Count('id', filter=Q(status='DELIVERED')),
            failed=Count('id', filter=Q(status='FAILED')),
            pending=Count('id', filter=Q(status='PENDING')),
            email=Count('id', filter=Q(channel_type='EMAIL')),
            sms=Count('id', filter=Q(channel_type='SMS'))
        )
        template_count = NotificationTemplate.objects.count()

        # Calculate rates
        total_notifications = notification_stats['total']
        delivered_count = notification_stats['delivered']
        delivery_rate = (delivered_count / total_notifications *
                         100) if total_notifications > 0 else 0
        success_rate = delivery_rate

        # Get notification type distribution
        email_count = notification_stats['email']
        sms_count = notification_stats['sms']

        # Calculate percentages for type data
        total_typed = email_count + sms_count
        email_percentage = (email_count / total_typed *
                            100) if total_typed > 0 else 0
        sms_percentage = (sms_count / total_typed *
                          100) if total_typed > 0 else 0

        # Get 6 months of data in single query
        six_months_ago = timezone.now() - relativedelta(months=6)
        monthly_data = Notification.objects.filter(
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            sent=Count('id'),
            delivered=Count('id', filter=Q(status='DELIVERED')),
            failed=Count('id', filter=Q(status='FAILED'))
        ).order_by('month')

        # Convert to required format
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        trend_data = []
        for data in monthly_data[-6:]:
            trend_data.append({
                'month': months[data['month'].month - 1],
                'sent': data['sent'],
                'delivered': data['delivered'],
                'failed': data['failed']
            })

        dashboard_data = {
            'kpmData': [
                {
                    'name': 'Total Notifications',
                    'color': '#6366f1',
                    'change': '+12%',
                    'changeType': 'positive'
                },
                {
                    'name': 'Delivered',
                    'color': '#10b981',
                    'change': '+8%',
                    'changeType': 'positive'
                },
                {
                    'name': 'Failed',
                    'color': '#ef4444',
                    'change': '-3%',
                    'changeType': 'negative'
                },
                {
                    'name': 'Pending',
                    'color': '#f59e0b',
                    'change': '+2%',
                    'changeType': 'neutral'
                },
                {
                    'name': 'Templates',
                    'color': '#8b5cf6',
                    'change': '+5%',
                    'changeType': 'positive'
                },
                {
                    'name': 'Delivery Rate',
                    'color': '#06b6d4',
                    'change': '+2.1%',
                    'changeType': 'positive'
                },
                {
                    'name': 'Success Rate',
                    'color': '#84cc16',
                    'change': '+1.5%',
                    'changeType': 'positive'
                }
            ],
            'notificationTypeData': [
                {
                    'name': 'Email',
                    'value': round(email_percentage),
                    'color': '#1976d2'
                },
                {
                    'name': 'SMS',
                    'value': round(sms_percentage),
                    'color': '#dc004e'
                },
                {
                    'name': 'Push',
                    'value': 20,
                    'color': '#2e7d32'
                },
                {
                    'name': 'Webhook',
                    'value': 5,
                    'color': '#ed6c02'
                }
            ],
            'notificationTrendData': trend_data
        }

        serializer = DashboardAnalyticsSerializer(dashboard_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationViewList(APIView):
    """
    API endpoint to retrieve notifications in the specified format
    """

    def get(self, request):
        notifications = Notification.objects.select_related(
            'notification_template').all()
        serializer = NotificationListSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TemplateByCodeView(APIView):
    """
    API endpoint to get a template by template code
    """

    def get(self, request, template_code):
        try:
            print('not foundddd', template_code)
            template = NotificationTemplate.objects.get(
                template_code=template_code)
            serializer = NotificationTemplateSerializer(template)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotificationTemplate.DoesNotExist:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)


class TemplateUpdateView(APIView):
    """
    API endpoint to update a template by id
    """

    def put(self, request, id):
        try:
            template = NotificationTemplate.objects.get(pk=id)
        except NotificationTemplate.DoesNotExist:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = NotificationTemplateSerializer(
            template, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceTemplatesAPIView(APIView):
    """
    API endpoint to retrieve templates for a service using API key authentication.
    Requires API key authentication via X-API-Key header.

    GET /api/notifications/service/templates
    """
    permission_classes = []

    def get(self, request):
        try:
            # Check API key permission
            permission = ApiKeyPermission()
            if not permission.has_permission(request, self):
                raise AuthenticationException(
                    message="Invalid or missing API key",
                    errors={
                        'api_key': 'The provided API key is invalid or missing from headers'
                    }
                )

            # Get the authenticated service from request
            service = request.service

            # Get all templates for this service
            templates = NotificationTemplate.objects.filter(
                service=service
            ).select_related('created_by').order_by('-created_at')

            # Serialize the templates
            serializer = TemplateListSerializer(templates, many=True)

            return success_response(
                message="Service templates retrieved successfully",
                data={
                    "service_name": service.service_name,
                    "service_code": service.service_code,
                    "templates": serializer.data,
                    "total_count": templates.count()
                },
                status_code=status.HTTP_200_OK
            )

        except AuthenticationException as e:
            return e.get_response()
        except Exception as e:
            server_exception = ServerException(
                message="Failed to process notification request",
                errors=format_errors(e)
            )
            return server_exception.get_response()
