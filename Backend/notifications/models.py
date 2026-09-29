from django.db import models
import uuid
from authentication.models import User
from services.models import GovernmentService


class NotificationTemplate(models.Model):
    """Stores message templates with versioning and approval status."""
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(GovernmentService, on_delete=models.CASCADE)
    template_code = models.CharField(max_length=100)
    template_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, null=True)
    channel_type = models.CharField(
        max_length=10, choices=[('SMS', 'SMS'), ('EMAIL', 'EMAIL')])
    language = models.CharField(max_length=10, default='en')
    subject_template = models.TextField(
        blank=True, null=True, help_text="For email notifications.")
    body_template = models.TextField()
    variables = models.JSONField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT)

    # Audit trail fields
    created_by = models.ForeignKey(
        User, related_name='created_templates', on_delete=models.SET_NULL, null=True, blank=True)
    approved_by = models.ForeignKey(
        User, related_name='approved_templates', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_templates'
        app_label = 'notifications'
        indexes = [models.Index(fields=['service', 'template_code'])]
        unique_together = ('service', 'template_code')

    def __str__(self):
        return f"{self.service.service_code} - {self.template_name}"


class NotificationRequest(models.Model):
    """Tracks all notification requests made by services for analytics and monitoring."""
    class RequestType(models.TextChoices):
        EMAIL = 'EMAIL', 'Email'
        SMS = 'SMS', 'SMS'
        PUSH = 'PUSH', 'Push Notification'

    class RequestStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        PARTIAL = 'PARTIAL', 'Partially Completed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey('services.GovernmentService', null=True, blank=True,
                                on_delete=models.SET_NULL, related_name='notification_requests')
    request_type = models.CharField(max_length=10, choices=RequestType.choices)
    total_recipients = models.IntegerField(default=0)
    successful_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20, choices=RequestStatus.choices, default=RequestStatus.PENDING)
    webhook_url = models.URLField(
        null=True, blank=True, help_text="Callback URL for status updates")
    webhook_sent = models.BooleanField(default=False)
    webhook_sent_at = models.DateTimeField(null=True, blank=True)
    webhook_response = models.JSONField(
        null=True, blank=True, help_text="Response from webhook call")
    metadata = models.JSONField(
        null=True, blank=True, help_text="Additional request metadata")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notification_requests'
        indexes = [
            models.Index(fields=['service', 'created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.service.service_code} - {self.request_type} - {self.status}"


class Batch(models.Model):
    """Stores information about a batch of notifications."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(
        GovernmentService, null=True, blank=True, on_delete=models.SET_NULL)
    notification_request = models.ForeignKey(
        NotificationRequest, on_delete=models.CASCADE, null=True, blank=True, related_name='batches')
    notification_template = models.ForeignKey(
        NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    batch_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default='DRAFT')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    callback_url = models.URLField(
        null=True, blank=True, help_text="URL to post status updates to upon completion.")
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = 'notifications'

    def __str__(self):
        return self.batch_name


class Notification(models.Model):
    """Stores a single notification message to a recipient."""
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        DELIVERED = 'DELIVERED', 'Delivered'
        FAILED = 'FAILED', 'Failed'

    class Priority(models.IntegerChoices):
        HIGH = 1, 'High'
        NORMAL = 2, 'Normal'
        LOW = 3, 'Low'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(
        GovernmentService, null=True, blank=True, on_delete=models.SET_NULL)
    notification_request = models.ForeignKey(
        NotificationRequest, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    batch = models.ForeignKey(
        Batch, on_delete=models.CASCADE, null=True, blank=True)
    notification_template = models.ForeignKey(
        NotificationTemplate, null=True, blank=True, on_delete=models.SET_NULL)
    recipient_name = models.CharField(max_length=255, null=True, blank=True)
    recipient_address = models.CharField(max_length=255)
    subject = models.CharField(
        max_length=500, null=True, blank=True, help_text="Email subject")
    channel_type = models.CharField(
        max_length=10, choices=[('SMS', 'SMS'), ('EMAIL', 'EMAIL')])
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING)
    priority = models.IntegerField(
        choices=Priority.choices, default=Priority.NORMAL)
    failure_reason = models.TextField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    cost = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True)
    variables = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    scheduled_at = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['notification_request', 'status']),
            models.Index(fields=['status', 'scheduled_at']),
            models.Index(fields=['recipient_address']),
        ]

    def __str__(self):
        return f"To: {self.recipient_address} | Status: {self.status}"


class UnsubscribedAddress(models.Model):
    """Stores addresses that have opted out of notifications."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    address = models.CharField(max_length=255, unique=True, db_index=True)
    address_type = models.CharField(
        max_length=10, choices=[('PHONE', 'PHONE'), ('EMAIL', 'EMAIL')])
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'notifications'

    def __str__(self):
        return self.address
