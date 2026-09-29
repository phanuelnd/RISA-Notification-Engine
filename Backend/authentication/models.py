# Backend/authentication/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, PermissionsMixin
from rest_framework_simplejwt.tokens import RefreshToken


class UserManager(BaseUserManager):

    def create_user(self, first_name, last_name,  email, is_staff=False, password=None):

        if not first_name:
            raise ValueError('The First Name field must be set')

        if not last_name:
            raise ValueError('The Last Name field must be set')

        if not email:
            raise ValueError('The Email field must be set')

        email = self.normalize_email(str(email).lower())

        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_staff=is_staff
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, first_name, last_name, email, password):

        if password is None:
            raise ValueError('Superuser must have a password.')

        # CORRECTED: Explicitly passed 'password' as a keyword argument.
        user = self.create_user(
            first_name, last_name, email, password=password)

        user.is_superuser = True
        user.is_admin = True
        user.is_verified = True
        user.is_staff = True
        user.save()
        return user


class User(AbstractUser, PermissionsMixin):
    username = None  # Remove the username field
    first_name = models.CharField(max_length=50, blank=False)
    last_name = models.CharField(max_length=50, blank=False)
    email = models.EmailField(max_length=255, unique=True, db_index=True)
    profile_picture = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        app_label = 'authentication'

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"

    def token(self):

        refresh = RefreshToken.for_user(self)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
