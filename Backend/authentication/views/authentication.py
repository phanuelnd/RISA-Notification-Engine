from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated # Added IsAuthenticated

from authentication.serializers.authentication import (
    UserLoginSerializer,
    UserSerializer,
    SignoutSerializer
)
from Utils import (
    ValidationException,
    AuthenticationException,
    ServerException
)
from Utils.constants.authentication import AuthenticationStatus
from Utils.custom_exceptions.format_error_message import format_errors
from Utils.responses import success_response


class SigninView(APIView):
    """
    Authenticate user and return tokens
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Validate request data exists
            if not request.data:
                raise ValidationException(
                    message="No credentials provided",
                    errors={'non_field_errors': [
                        'Email and password are required']}
                )

            # Validate serializer data
            serializer = UserLoginSerializer(data=request.data)

            if not serializer.is_valid():
                # Check for unverified email error with custom status code
                if 'status_code' in serializer.errors and serializer.errors['status_code'][0] == str(AuthenticationStatus.UNVERIFIED_EMAIL):
                    raise ValidationException(
                        message="Email not verified",
                        errors={
                            'non_field_errors': [AuthenticationStatus.MESSAGES[AuthenticationStatus.UNVERIFIED_EMAIL]]
                        },
                        status_code=AuthenticationStatus.UNVERIFIED_EMAIL
                    )
                else:
                    success_response(
                message='Login successful',
                data={
                    'user': user_data,
                    'tokens': tokens
                }
            )
                    # raise ValidationException(
                    #     message="Login failed due to invalid credentials",
                    #     errors=serializer.errors
                    # )

            # Authenticate user and generate tokens
            user = serializer.validated_data['user']
            user_data = UserSerializer(user).data
            tokens = user.token()

            return success_response(
                message='Login successful',
                data={
                    'user': user_data,
                    'tokens': tokens
                }
            )

        except (ValidationException, AuthenticationException) as e:
            return e.get_response()
        except Exception as e:
            server_exception = ServerException(
                message="An unexpected error occurred during login",
                errors=format_errors(e)
            )
            return server_exception.get_response()

# --- ADDED THIS ENTIRE CLASS ---
class SignoutView(APIView):
    """
    Blacklist the user's refresh token to log them out.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = SignoutSerializer(data=request.data)
            if not serializer.is_valid():
                raise ValidationException(
                    message="Refresh token is required",
                    errors=serializer.errors
                )
            
            serializer.save()

            return success_response(
                message="Logout successful"
            )

        except ValidationException as e:
            return e.get_response()
        except Exception as e:
            server_exception = ServerException(
                message="An unexpected error occurred during logout",
                errors=format_errors(e)
            )
            return server_exception.get_response()