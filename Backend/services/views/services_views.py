from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from Utils.authentication.permissions.staff_auth_permission import AdminPermission
from Utils.custom_exceptions.api_exceptions import ValidationException, ResourceNotFoundException, ServerException
from Utils.custom_exceptions.format_error_message import format_errors
from Utils.responses.api_responses import success_response

from ..models import GovernmentService
from ..serializers.serializers import GovernmentServiceSerializer, GovernmentServiceCreateSerializer


class GovernmentServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing GovernmentService instances.
    Admins can create, update, or delete services.
    """
    queryset = GovernmentService.objects.filter(is_active=True).order_by('-created_at')
    permission_classes = [AdminPermission]

    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action
        """
        if self.action == 'create':
            return GovernmentServiceCreateSerializer
        return GovernmentServiceSerializer

    def list(self, request, *args, **kwargs):
        """
        List all government services
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)

            return success_response(
                message="Services retrieved successfully",
                data=serializer.data
            )
        except Exception as e:
            server_exception = ServerException(
                message="An unexpected error occurred while retrieving services",
                errors=format_errors(e)
            )
            return server_exception.get_response()

    def create(self, request, *args, **kwargs):
        """
        Create a new government service with auto-generated API key
        """
        try:
            serializer = self.get_serializer(data=request.data)

            if not serializer.is_valid():
                raise ValidationException(
                    message="Failed to create service",
                    errors=serializer.errors
                )

            service = serializer.save()

            return success_response(
                message="Service created successfully",
                data=serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationException as e:
            return e.get_response()
        except Exception as e:
            server_exception = ServerException(
                message="An unexpected error occurred while creating the service",
                errors=format_errors(e)
            )
            return server_exception.get_response()

    def retrieve(self, request, pk=None, *args, **kwargs):
        """
        Retrieve a specific government service by ID
        """
        try:
            service = get_object_or_404(self.get_queryset(), pk=pk)
            serializer = self.get_serializer(service)

            return success_response(
                message="Service retrieved successfully",
                data=serializer.data
            )
        except Exception as e:
            server_exception = ServerException(
                message="An unexpected error occurred while retrieving the service",
                errors=format_errors(e)
            )
            return server_exception.get_response()

    def update(self, request, pk=None, *args, **kwargs):
        """
        Update a government service
        """
        try:
            service = get_object_or_404(self.get_queryset(), pk=pk)
            serializer = self.get_serializer(service, data=request.data)

            if not serializer.is_valid():
                raise ValidationException(
                    message="Failed to update service",
                    errors=serializer.errors
                )

            serializer.save()

            return success_response(
                message="Service updated successfully",
                data=serializer.data
            )
        except ValidationException as e:
            return e.get_response()
        except Exception as e:
            server_exception = ServerException(
                message="An unexpected error occurred while updating the service",
                errors=format_errors(e)
            )
            return server_exception.get_response()

    def destroy(self, request, pk=None, *args, **kwargs):
        """
        Deactivate a government service (soft delete)
        """
        try:
            service = get_object_or_404(GovernmentService, pk=pk)
            service.delete()

            return success_response(
                message="Service deleted successfully",
                data={"id": str(service.id), "is_active": service.is_active}
            )
        except Exception as e:
            server_exception = ServerException(
                message="An unexpected error occurred while deleting the service",
                errors=format_errors(e)
            )
            return server_exception.get_response()

    @action(detail=True, methods=['post'])
    def regenerate_api_key(self, request, pk=None):
        """
        Regenerate API key for a service
        """
        try:
            service = get_object_or_404(GovernmentService, pk=pk)

            # Clear existing API key hash to trigger regeneration
            service.api_key_hash = ''
            service.save()

            # Get the newly generated API key
            api_key = getattr(service, '_raw_api_key', None)

            if not api_key:
                raise ServerException(
                    message="Failed to regenerate API key",
                    errors={"api_key": ["API key regeneration failed"]}
                )

            return success_response(
                message="API key regenerated successfully",
                data={"api_key": api_key}
            )
        except ResourceNotFoundException as e:
            return e.get_response()
        except ServerException as e:
            return e.get_response()
        except Exception as e:
            server_exception = ServerException(
                message="An unexpected error occurred while regenerating the API key",
                errors=format_errors(e)
            )
            return server_exception.get_response()
