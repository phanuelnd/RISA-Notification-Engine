from rest_framework import status
from rest_framework.response import Response as _Response


class APIException(Exception):
    """
    Custom API exception for consistent error handling across the application
    """

    def __init__(self, message="An error occurred", errors=None, status_code=400, status=status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.errors = errors if errors is not None else {}
        self.status_code = status_code
        self.status = status
        super().__init__(self.message)

    def get_response(self):
        """
        Return a formatted Response object for the exception
        """
        return _Response({
            'success': False,
            'message': self.message,
            'errors': self.errors,
            'status_code': self.status_code
        }, status=self.status)


class ValidationException(APIException):
    """
    Exception for validation errors
    """

    def __init__(self, message="Validation failed", errors=None, status_code=400):
        super().__init__(
            message=message,
            errors=errors,
            status_code=status_code,
            status=status.HTTP_400_BAD_REQUEST
        )


class AuthenticationException(APIException):
    """
    Exception for authentication errors
    """

    def __init__(self, message="Authentication failed", errors=None):
        super().__init__(
            message=message,
            errors=errors,
            status_code=401,
            status=status.HTTP_401_UNAUTHORIZED
        )


class UnauthorizedException(APIException):
    """
    Exception for unauthorized access
    """

    def __init__(self, message="Unauthorized access", errors=None):
        super().__init__(
            message=message,
            errors=errors,
            status_code=403,
            status=status.HTTP_403_FORBIDDEN
        )


class ResourceNotFoundException(APIException):
    """
    Exception for resource not found errors
    """

    def __init__(self, resource_name="Resource"):
        message = f"{resource_name} not found"
        errors = {'detail': f'The requested {resource_name} does not exist.'}
        super().__init__(
            message=message,
            errors=errors,
            status_code=404,
            status=status.HTTP_404_NOT_FOUND
        )


class ServerException(APIException):
    """
    Exception for server errors
    """

    def __init__(self, message="Internal server error", errors=None):
        super().__init__(
            message=message,
            errors=errors,
            status_code=500,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
