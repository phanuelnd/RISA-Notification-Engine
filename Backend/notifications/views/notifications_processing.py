from django.utils import timezone
from Utils.custom_exceptions.format_error_message import format_errors
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from notifications.models import (
    Notification,
    NotificationRequest,
    NotificationTemplate
)
from notifications.serializers.notification_request_serializers import (
    SendNotificationSerializer,
    NotificationRequestStatusSerializer,
    FailedNotificationSerializer
)
from Utils.custom_exceptions.api_exceptions import (
    ValidationException,
    AuthenticationException,
    UnauthorizedException,
    ResourceNotFoundException,
    ServerException
)
from Utils.responses.api_responses import success_response
from Utils.authentication.permissions.api_key_permission import ApiKeyPermission

from notifications.tasks import process_notification_request_task
import re


class SendNotificationAPIView(APIView):
    """
    API endpoint for services to send email notifications.
    Requires API key authentication via X-API-Key header.

    POST /api/notifications/send
    """
    permission_classes = []

    def _replace_variables(self, template_text, variables):
        """
        Replace variable placeholders like {{variable_name}} with actual values.
        If a variable is not found in the variables dict, keep the placeholder as-is.

        Args:
            template_text: String containing placeholders like {{name}}, {{email}}
            variables: Dictionary containing variable values

        Returns:
            String with variables replaced where available
        """
        if not template_text:
            return template_text

        def replace_match(match):
            var_name = match.group(1).strip()
            # Only replace if variable exists in the dictionary
            # Otherwise, keep the placeholder as-is
            return str(variables.get(var_name, match.group(0)))

        # Match {{variable_name}} pattern
        return re.sub(r'\{\{\s*([^}]+)\s*\}\}', replace_match, template_text)

    def post(self, request):
        try:
            # Check API key permission
            permission = ApiKeyPermission()
            if not permission.has_permission(request, self):
                raise AuthenticationException(
                    message="Invalid or missing API key",
                    errors={
                        'api_key': 'The provided API key is invalid or missing from headers'}
                )

            # Get the authenticated service from request
            service = request.service

            # Validate request data
            serializer = SendNotificationSerializer(data=request.data)
            if not serializer.is_valid():
                raise ValidationException(
                    message="Invalid request data",
                    errors=serializer.errors
                )

            validated_data = serializer.validated_data
            recipients = validated_data['recipients']
            template_id = validated_data.get('template_id')
            webhook_url = validated_data.get('webhook_url')
            metadata = validated_data.get('metadata', {})

            if len(recipients) > service.allowed_batch_size:
                raise ValidationException(
                    message=f"Batch size exceeds the allowed limit of {service.allowed_batch_size} recipients",
                    errors={
                        'recipients': f'Maximum {service.allowed_batch_size} recipients allowed per request'}
                )
            # Determine if using template or direct message
            template = None
            if template_id:
                # Template-based sending
                try:
                    template = NotificationTemplate.objects.get(id=template_id)
                except NotificationTemplate.DoesNotExist:
                    raise ResourceNotFoundException(
                        resource_name="Template",
                        details={'template_id': 'Template not found'}
                    )

                # Validate template and variables
                try:
                    serializer.validate_template_variables(
                        template, recipients, service)
                except DRFValidationError as validation_error:
                    # Convert DRF validation errors to our custom ValidationException
                    raise ValidationException(
                        message="Template validation failed",
                        errors=validation_error.detail
                    )

                subject = template.subject_template
                message = template.body_template
                channel_type = template.channel_type
            else:
                # Direct message sending
                subject = validated_data['subject']
                message = validated_data['message']
                channel_type = 'EMAIL'

            # Create NotificationRequest for tracking
            notification_request = NotificationRequest.objects.create(
                service=service,
                request_type=NotificationRequest.RequestType.EMAIL,
                total_recipients=len(recipients),
                webhook_url=webhook_url,
                metadata={
                    **metadata,
                    'subject': subject,
                    'message': message,
                    'template_id': str(template_id) if template_id else None,
                    'template_name': template.template_name if template else None
                }
            )

            # Create individual Notification records
            notifications_to_create = []
            for recipient in recipients:
                # Replace variable placeholders in message with recipient data
                personalized_message = self._replace_variables(
                    message, recipient)
                personalized_subject = self._replace_variables(
                    subject, recipient) if subject else ''

                notification = Notification(
                    service=service,
                    notification_request=notification_request,
                    notification_template=template,  # Will be None for direct sends
                    recipient_name=recipient.get('name', ''),
                    recipient_address=recipient['email'],
                    subject=personalized_subject,
                    channel_type=channel_type,
                    status=Notification.Status.PENDING,
                    scheduled_at=timezone.now(),
                    metadata={
                        'message': personalized_message,
                        'subject': personalized_subject,
                        'original_message': message,
                        'original_subject': subject,
                        'recipient_data': recipient,
                        'template_used': template.template_name if template else None
                    }
                )
                notifications_to_create.append(notification)

            # Bulk create notifications
            Notification.objects.bulk_create(notifications_to_create)

            process_notification_request_task.delay(
                str(notification_request.id))

            # Return response
            response_data = {
                "request_id": str(notification_request.id),
                "status": "pending",
                "total_recipients": len(recipients),
                "estimated_processing_time": f"{len(recipients) * 0.5} seconds",
                "sending_method": "template" if template else "direct",
                "template_name": template.template_name if template else None
            }

            return success_response(
                message="Notification request received and queued for processing",
                data=response_data,
                status_code=status.HTTP_202_ACCEPTED
            )

        except (ValidationException, AuthenticationException) as e:
            return e.get_response()

        except Exception as e:
            server_exception = ServerException(
                message="Failed to process notification request",
                errors=format_errors(e)
            )
            return server_exception.get_response()


class NotificationRequestStatusAPIView(APIView):
    """
    API endpoint to check the status of a notification request.
    Requires API key authentication.

    GET /api/notifications/requests/{request_id}
    """
    permission_classes = []

    def get(self, request, request_id):

        # Check API key permission
        permission = ApiKeyPermission()
        if not permission.has_permission(request, self):
            raise AuthenticationException(
                message="Invalid or missing API key",
                errors={
                    'api_key': 'The provided API key is invalid or missing from headers'}
            )

        try:
            notification_request = NotificationRequest.objects.get(
                id=request_id)

            # Verify the request belongs to the authenticated service
            if notification_request.service.id != request.service.id:
                raise UnauthorizedException(
                    message="Unauthorized access to this notification request",
                    errors={
                        'request_id': 'You do not have permission to access this notification request'}
                )

            # Get failed notifications if any
            failed_notifications = Notification.objects.filter(
                notification_request=notification_request,
                status=Notification.Status.FAILED
            )

            serializer = NotificationRequestStatusSerializer(
                notification_request)
            response_data = serializer.data

            # Add failed notifications list
            if failed_notifications.exists():
                failed_serializer = FailedNotificationSerializer(
                    failed_notifications, many=True)
                response_data['failed_notifications'] = failed_serializer.data

            return success_response(
                message="Notification request status retrieved successfully",
                data=response_data,
                status_code=status.HTTP_200_OK
            )

        except NotificationRequest.DoesNotExist as e:
            resource_not_found_exception = ResourceNotFoundException(
                resource_name="Notification request")
            return resource_not_found_exception.get_response()
        except (UnauthorizedException, AuthenticationException) as e:
            return e.get_response()
        except Exception as e:
            server_exception = ServerException(
                message="Failed to process notification request",
                errors=format_errors(e)
            )
            return server_exception.get_response()
