# notifications/tasks.py

from celery import shared_task
from django.utils import timezone
from .models import Notification
import time

@shared_task
def send_notification_task(notification_id):
    """
    Celery task to process and send a single notification.
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        notification.status = 'PROCESSING'
        notification.save()

        # --- THIS IS WHERE YOU INTEGRATE WITH A REAL SENDING SERVICE ---
        # For example, using Twilio for SMS or SendGrid for Email.
        # We will simulate the process for now.
        print(f"Sending notification {notification.id} to {notification.recipient_address}...")
        time.sleep(3) # Simulates the time taken to send the message
        print("...Notification sent successfully!")
        # --- END OF SIMULATION ---

        notification.status = 'DELIVERED'
        notification.sent_at = timezone.now()
        notification.save()

    except Notification.DoesNotExist:
        print(f"Notification with id {notification_id} not found.")
    except Exception as e:
        print(f"Failed to send notification {notification_id}. Error: {e}")
        # Optionally, update the notification status to FAILED
        if 'notification' in locals():
            notification.status = 'FAILED'
            notification.save()