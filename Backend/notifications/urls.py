from django.urls import path, include
from rest_framework.routers import DefaultRouter
from notifications.views.views import (
    NotificationStatusView,
    NotificationTemplateViewSet,
    BatchCreateView,
    BatchProcessView,
    BatchStatusView,
    AnalyticsSummaryView,
    UnsubscribeView,
    UnsubscribeCheckView,
    NotificationViewList,
    DashboardAnalyticsView,
    TemplateByCodeView,
    TemplateUpdateView,
    TemplateViewList,
    ServiceTemplatesAPIView,
)

from notifications.views.notifications_processing import (
    SendNotificationAPIView,
    NotificationRequestStatusAPIView
)

router = DefaultRouter()
router.register(r'templates', NotificationTemplateViewSet, basename='template')

urlpatterns = [

    # New API endpoints for external services
    path('send/', SendNotificationAPIView.as_view(), name='send-notification'),
    path('requests/<uuid:request_id>/', NotificationRequestStatusAPIView.as_view(),
         name='notification-request-status'),
    path('service/templates/', ServiceTemplatesAPIView.as_view(),
         name='service-templates'),

    # URL for dashboard analytics
    path('dashboard/analytics/', DashboardAnalyticsView.as_view(),
         name='dashboard-analytics'),

    # URL for template list
    path('templates/list', TemplateViewList.as_view(), name='template-list'),
    
    # URL for getting template by code
    path('templates/<str:template_code>', TemplateByCodeView.as_view(), name='template-by-code'),
    
    # URL for updating template
    path('templates/<str:id>/update', TemplateUpdateView.as_view(), name='template-update'),
    
    # URL for notification list
    path('list/', NotificationViewList.as_view(), name='notification-list'),

    # URL for checking a single notification's status
    path('<uuid:notification_id>/', NotificationStatusView.as_view(),
         name='get-notification-status'),

    # URLs for batches
    path('batches/', BatchCreateView.as_view(), name='create-batch'),
    path('batches/<uuid:batch_id>/',
         BatchStatusView.as_view(), name='get-batch-status'),
    path('batches/<uuid:batch_id>/process/',
         BatchProcessView.as_view(), name='process-batch'),

    # URLs for analytics and unsubscribes
    path('analytics/summary/', AnalyticsSummaryView.as_view(),
         name='analytics-summary'),
    path('unsubscribe/', UnsubscribeView.as_view(), name='unsubscribe'),
    path('unsubscribe/check/', UnsubscribeCheckView.as_view(),
         name='unsubscribe-check'),

    # Include the router-generated URLs for templates
    path('', include(router.urls)),
    
]
