from rest_framework import serializers
from django.contrib.auth import authenticate
from authentication.models import User
# ADDED: Imports for the SignoutSerializer
from rest_framework_simplejwt.tokens import RefreshToken, TokenError


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name',
                  'email', 'is_verified', 'profile_picture')
        read_only_fields = ('id', 'is_verified', 'created_at')


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)

            if not user:
                raise serializers.ValidationError({
                    "non_field_errors": ["Invalid email or password."]
                })

            if not user.is_active:
                raise serializers.ValidationError({
                    "non_field_errors": ["User account is disabled."]
                })

            attrs['user'] = user
            return attrs

        raise serializers.ValidationError({
            "non_field_errors": ["Must include email and password."]
        })

# --- ADDED THIS ENTIRE CLASS ---


class SignoutSerializer(serializers.Serializer):
    """
    Serializer for handling user sign-out by blacklisting the refresh token.
    """
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs

    def save(self, **kwargs):
        try:
            RefreshToken(self.token).blacklist()
        except TokenError:
            # This happens if the token is already invalid
            raise serializers.ValidationError({
                "refresh": ["Token is invalid or expired."]
            })
