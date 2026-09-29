import uuid
import secrets
import hashlib
from django.db import models


class GovernmentService(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_code = models.CharField(max_length=50, unique=True)
    service_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    contact_email = models.CharField(max_length=255, blank=True, null=True)
    allowed_batch_size = models.IntegerField(default=10000)
    api_key_hash = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'government_services'
        app_label = 'services'
        ordering = ['created_at']  # default ordering: older first, newer come after

    def __str__(self):
        return f"{self.service_code} - {self.service_name}"

    @staticmethod
    def generate_api_key():
        """Generate a secure API key"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_api_key(api_key):
        """Hash an API key for secure storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    @classmethod
    def created_after(cls, dt):
        """
        Return queryset of services created after the given datetime,
        ordered by created_at (older first, newer come after).
        """
        return cls.objects.filter(created_at__gt=dt).order_by('created_at')

    def save(self, *args, **kwargs):
        """Override save method to generate API key if not present"""
        if not self.api_key_hash:
            api_key = self.generate_api_key()
            self.api_key_hash = self.hash_api_key(api_key)
            # We'll return the raw API key after saving
            self._raw_api_key = api_key
        super().save(*args, **kwargs)
