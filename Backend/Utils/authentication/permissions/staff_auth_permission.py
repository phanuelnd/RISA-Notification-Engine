from rest_framework import permissions


class AdminPermission(permissions.BasePermission):
    """Permission class to ensure only admins can access restricted views"""

    def has_permission(self, request, view):
        return request.user and request.user.is_admin
