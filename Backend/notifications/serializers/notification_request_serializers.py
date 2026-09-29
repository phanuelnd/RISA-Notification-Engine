from rest_framework import serializers
from notifications.models import Notification, NotificationRequest, NotificationTemplate
import re


class RecipientSerializer(serializers.Serializer):
    """Serializer for individual recipients in a notification request"""
    email = serializers.EmailField(required=True)

    def to_internal_value(self, data):
        """Allow dynamic fields but ensure email is present"""
        if not isinstance(data, dict):
            raise serializers.ValidationError("Recipient must be an object")

        if 'email' not in data:
            raise serializers.ValidationError(
                "Email is required for each recipient")

        # Validate email field
        email_field = serializers.EmailField()
        try:
            data['email'] = email_field.to_internal_value(data['email'])
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"email": e.detail})

        # Return all fields as-is (dynamic fields allowed)
        return data


class SendNotificationSerializer(serializers.Serializer):
    """Serializer for sending email notifications"""
    recipients = RecipientSerializer(many=True)
    template_id = serializers.UUIDField(required=False, allow_null=True)
    subject = serializers.CharField(max_length=500, required=False, allow_null=True, allow_blank=True)
    message = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    webhook_url = serializers.URLField(
        required=False, allow_null=True, allow_blank=True)
    metadata = serializers.JSONField(required=False, default=dict)

    def validate_recipients(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one recipient is required")

        return value
    
    def validate(self, data):
        """Validate that either template_id or subject+message is provided"""
        template_id = data.get('template_id')
        subject = data.get('subject')
        message = data.get('message')
        
        # Must provide either template_id OR both subject and message
        if not template_id and (not subject or not message):
            raise serializers.ValidationError({
                'template_id': 'Either provide template_id or both subject and message'
            })
        
        if template_id and (subject or message):
            raise serializers.ValidationError({
                'template_id': 'Cannot provide both template_id and subject/message. Choose one method.'
            })
        
        return data
    
    def validate_template_variables(self, template, recipients, service):
        """Validate that template belongs to service and recipients have all required variables"""
        # Check template belongs to the service
        if template.service.id != service.id:
            raise serializers.ValidationError({
                'template_id': f'Template does not belong to service {service.service_code}'
            })
        
        # Check template is active
        if not template.is_active:
            raise serializers.ValidationError({
                'template_id': 'Template is not active'
            })
        
        # Extract required variables from template
        required_variables = set()
        if template.subject_template:
            required_variables.update(re.findall(r'\{\{\s*([^}]+)\s*\}\}', template.subject_template))
        if template.body_template:
            required_variables.update(re.findall(r'\{\{\s*([^}]+)\s*\}\}', template.body_template))
        
        # Remove 'email' from required variables as it's already required in RecipientSerializer
        required_variables.discard('email')
        
        if not required_variables:
            return  # No variables required
        
        # Check each recipient has all required variables
        missing_variables_per_recipient = []
        for idx, recipient in enumerate(recipients):
            recipient_keys = set(recipient.keys())
            missing = required_variables - recipient_keys
            if missing:
                missing_variables_per_recipient.append({
                    'recipient_index': idx,
                    'email': recipient.get('email', 'N/A'),
                    'missing_variables': list(missing)
                })
        
        if missing_variables_per_recipient:
            raise serializers.ValidationError({
                'recipients': f'Some recipients are missing required template variables. Required: {list(required_variables)}',
                'details': missing_variables_per_recipient
            })


class NotificationRequestStatusSerializer(serializers.ModelSerializer):
    """Serializer for notification request status"""
    service_name = serializers.CharField(
        source='service.service_name', read_only=True)
    service_code = serializers.CharField(
        source='service.service_code', read_only=True)

    class Meta:
        model = NotificationRequest
        fields = [
            'id', 'service_name', 'service_code', 'request_type',
            'total_recipients', 'successful_count', 'failed_count',
            'status', 'created_at', 'updated_at', 'completed_at',
            'metadata'
        ]
        read_only_fields = fields


class FailedNotificationSerializer(serializers.ModelSerializer):
    """Serializer for failed notifications"""
    class Meta:
        model = Notification
        fields = ['id', 'recipient_name', 'recipient_address',
                  'failure_reason', 'retry_count']
