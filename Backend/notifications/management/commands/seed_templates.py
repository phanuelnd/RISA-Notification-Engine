from django.core.management.base import BaseCommand
from notifications.models import NotificationTemplate
from services.models import GovernmentService

class Command(BaseCommand):
    help = 'Create sample notification templates'

    def handle(self, *args, **options):
        # Get or create a default service
        service, created = GovernmentService.objects.get_or_create(
            service_code='DEFAULT',
            defaults={'service_name': 'Default Service'}
        )

        templates = [
            {
                'template_code': 'WELCOME_EMAIL',
                'template_name': 'Welcome Email',
                'category': 'User Onboarding',
                'channel_type': 'EMAIL',
                'subject_template': 'Welcome to {{service_name}}!',
                'body_template': 'Hi {{user_name}},\n\nWelcome to {{service_name}}! Your account has been created successfully.\n\nBest regards,\nThe Team',
                'status': NotificationTemplate.Status.APPROVED
            },
            {
                'template_code': 'PASSWORD_RESET',
                'template_name': 'Password Reset',
                'category': 'Security',
                'channel_type': 'EMAIL',
                'subject_template': 'Reset Your Password',
                'body_template': 'Hi {{user_name}},\n\nClick here to reset your password: {{reset_link}}\n\nThis link expires in {{expiry_hours}} hours.',
                'status': NotificationTemplate.Status.APPROVED
            },
            {
                'template_code': 'ORDER_CONFIRMATION',
                'template_name': 'Order Confirmation SMS',
                'category': 'Commerce',
                'channel_type': 'SMS',
                'body_template': 'Hi {{customer_name}}, your order #{{order_number}} for ${{amount}} has been confirmed. Delivery: {{delivery_date}}',
                'status': NotificationTemplate.Status.APPROVED
            }
        ]

        for template_data in templates:
            template, created = NotificationTemplate.objects.get_or_create(
                service=service,
                template_code=template_data['template_code'],
                defaults=template_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Template created: {template.template_name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Template already exists: {template.template_name}')
                )

        self.stdout.write(self.style.SUCCESS('Template seeding completed'))