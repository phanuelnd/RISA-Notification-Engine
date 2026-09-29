from django.db.models import Max
from rest_framework import serializers
from notifications.models import (
    NotificationTemplate,
    Batch,
    Notification,
    UnsubscribedAddress,
    NotificationRequest
)
from services.models import GovernmentService

from services.models import GovernmentService


class GovernmentServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernmentService
        fields = ['service_name', 'service_code']


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = '__all__'
        read_only_fields = ['created_by', 'approved_by']


class NotificationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        depth = 1  # Show related object details instead of just IDs


class BatchRecipientSerializer(serializers.Serializer):
    address = serializers.CharField()
    variables = serializers.JSONField(required=False, default=dict)


class BatchCreateSerializer(serializers.Serializer):
    batch_name = serializers.CharField(max_length=255)
    template_code = serializers.CharField(max_length=100)
    service_code = serializers.CharField(max_length=50)
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    callback_url = serializers.URLField(required=False, allow_null=True)
    recipients = BatchRecipientSerializer(many=True, allow_empty=False)


class BatchStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'
        depth = 1  # Show related object details


class UnsubscribeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnsubscribedAddress
        fields = ['address', 'address_type', 'reason']


class TemplateListSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    name = serializers.CharField(source='template_name')
    description = serializers.CharField(source='category')
    type = serializers.SerializerMethodField()
    subject = serializers.CharField(source='subject_template')
    content = serializers.CharField(source='body_template')
    variables = serializers.SerializerMethodField()
    isActive = serializers.BooleanField(source='is_active')
    createdAt = serializers.DateTimeField(source='created_at')
    updatedAt = serializers.DateTimeField(source='updated_at')
    createdBy = serializers.SerializerMethodField()
    lastUsed = serializers.SerializerMethodField()
    usageCount = serializers.SerializerMethodField()

    class Meta:
        model = NotificationTemplate
        fields = ['id', 'name', 'description', 'type', 'subject', 'content', 'variables',
                  'isActive', 'createdAt', 'updatedAt', 'createdBy', 'lastUsed', 'usageCount']

    def get_type(self, obj):
        return obj.channel_type.lower()

    def get_variables(self, obj):
        import re
        # Extract variables from template content using regex
        variables = re.findall(r'{{(.*?)}}', obj.body_template)
        if obj.subject_template:
            variables.extend(re.findall(r'{{(.*?)}}', obj.subject_template))
        return list(set(variables))  # Remove duplicates

    # def get_variables(self, obj):
    #     return obj.variables

    def get_createdBy(self, obj):
        return obj.created_by.email if obj.created_by else 'system'

    def get_lastUsed(self, obj):
        # Get the most recent notification using this template
        last_notification = Notification.objects.filter(
            notification_template=obj).aggregate(Max('sent_at'))
        return last_notification['sent_at__max']

    def get_usageCount(self, obj):
        # Count notifications using this template
        return Notification.objects.filter(notification_template=obj).count()


class NotificationListSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='pk')
    title = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    priority = serializers.SerializerMethodField()
    recipient = serializers.CharField(source='recipient_address')
    recipientName = serializers.SerializerMethodField()
    templateId = serializers.SerializerMethodField()
    templateName = serializers.SerializerMethodField()
    scheduledAt = serializers.DateTimeField(source='scheduled_at')
    sentAt = serializers.DateTimeField(source='sent_at')
    deliveredAt = serializers.DateTimeField(source='sent_at')
    metadata = serializers.JSONField()
    createdAt = serializers.DateTimeField(source='created_at')
    updatedAt = serializers.DateTimeField(source='created_at')

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'status', 'priority', 'recipient',
                  'recipientName', 'templateId', 'templateName', 'scheduledAt', 'sentAt',
                  'deliveredAt', 'metadata', 'createdAt', 'updatedAt']

    def get_title(self, obj):
        template = getattr(obj, 'notification_template', None)
        if template:
            return template.template_name
        # Fallback to subject or a generic title
        return obj.subject or f"{(obj.channel_type or 'Notification').title()} Notification"

    def get_message(self, obj):
        template = getattr(obj, 'notification_template', None)
        if template:
            return template.body_template
        # No template body available
        return ''

    def get_type(self, obj):
        return obj.channel_type.lower()

    def get_status(self, obj):
        return obj.status.lower()

    def get_priority(self, obj):
        priority_map = {1: 'high', 2: 'normal', 3: 'low'}
        return priority_map.get(obj.priority, 'normal')

    def get_recipientName(self, obj):
        if obj.variables and 'recipientName' in obj.variables:
            return obj.variables['recipientName']

        if '@' in obj.recipient_address:
            return obj.recipient_address.split('@')[0]

        return 'User'

    def get_templateId(self, obj):
        template = getattr(obj, 'notification_template', None)
        return template.template_code if template else None

    def get_templateName(self, obj):
        template = getattr(obj, 'notification_template', None)
        return template.template_name if template else None


class DashboardAnalyticsSerializer(serializers.Serializer):
    kpmData = serializers.ListField()
    notificationTypeData = serializers.ListField()
    notificationTrendData = serializers.ListField()
