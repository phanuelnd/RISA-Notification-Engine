from django.core.management.base import BaseCommand
from services.models import GovernmentService

class Command(BaseCommand):
    help = 'Create test government services'

    def handle(self, *args, **options):
        services = [
            {
                'service_code': 'MOH',
                'service_name': 'Ministry of Health',
                'description': 'Health notifications and alerts',
                'contact_email': 'admin@moh.gov.rw'
            },
            {
                'service_code': 'MINEDUC',
                'service_name': 'Ministry of Education',
                'description': 'Education system notifications',
                'contact_email': 'admin@mineduc.gov.rw'
            },
            {
                'service_code': 'RRA',
                'service_name': 'Rwanda Revenue Authority',
                'description': 'Tax and revenue notifications',
                'contact_email': 'admin@rra.gov.rw'
            }
        ]

        for service_data in services:
            service, created = GovernmentService.objects.get_or_create(
                service_code=service_data['service_code'],
                defaults=service_data
            )
            
            if created:
                api_key = getattr(service, '_raw_api_key', 'N/A')
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Service created: {service.service_code} - API Key: {api_key}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Service already exists: {service.service_code}')
                )

        self.stdout.write(self.style.SUCCESS('Services seeding completed'))