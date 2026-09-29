from django.core.management.base import BaseCommand
from authentication.models import User

class Command(BaseCommand):
    help = 'Create test users for authentication'

    def handle(self, *args, **options):
        # Create admin user
        if not User.objects.filter(email='admin@risa.gov.rw').exists():
            User.objects.create_superuser(
                first_name='Admin',
                last_name='User',
                email='admin@risa.gov.rw',
                password='admin123'
            )
            self.stdout.write(self.style.SUCCESS('Admin user created: admin@risa.gov.rw / admin123'))

        # Create regular user
        if not User.objects.filter(email='user@risa.gov.rw').exists():
            User.objects.create_user(
                first_name='Test',
                last_name='User',
                email='user@risa.gov.rw',
                password='user123'
            )
            self.stdout.write(self.style.SUCCESS('Regular user created: user@risa.gov.rw / user123'))

        self.stdout.write(self.style.SUCCESS('User seeding completed'))