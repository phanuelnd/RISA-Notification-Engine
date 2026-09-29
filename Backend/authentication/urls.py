from django.urls import path
from .views.authentication import (
    SigninView,
    SignoutView  # 1. Import the new view
)

app_name = 'authentication'

urlpatterns = [
    path('signin/', SigninView.as_view(), name='signin'),
    path('signout/', SignoutView.as_view(), name='signout'),
]