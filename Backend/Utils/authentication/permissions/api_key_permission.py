import hashlib
from rest_framework import permissions
from services.models import GovernmentService


class ApiKeyPermission(permissions.BasePermission):
    """
    Custom permission to check for valid API key in request header
    """

    def has_permission(self, request, view):
        # Get API key from header
        api_key = request.headers.get('X-API-Key')

        if not api_key:
            return False

        # Hash the provided API key
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        # Check if any active service has this API key hash
        try:
            service = GovernmentService.objects.filter(
                api_key_hash=api_key_hash,
                is_active=True
            ).first()

            if service:
                # Add the service to the request for further use in views
                request.service = service
                return True

        except Exception:
            pass

        return False
