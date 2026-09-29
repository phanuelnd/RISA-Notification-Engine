from rest_framework.routers import DefaultRouter
from .views.services_views import GovernmentServiceViewSet

app_name = 'services'

router = DefaultRouter()
router.register('', GovernmentServiceViewSet, basename='services')

urlpatterns = router.urls
