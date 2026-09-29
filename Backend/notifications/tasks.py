import requests
from celery import shared_task, group
from django.utils import timezone
from django.conf import settings
from notifications.models import Notification, Batch, UnsubscribedAddress, NotificationRequest
from Utils.email_service.email_service import EmailService
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_email_notification_task(notification_id):
    """
    Celery task to process and send a single email notification.
    """
    try:
        notification = Notification.objects.get(id=notification_id)

        # Check if recipient has unsubscribed
        if UnsubscribedAddress.objects.filter(address=notification.recipient_address).exists():
            notification.status = Notification.Status.FAILED
            notification.failure_reason = "Recipient has unsubscribed."
            notification.save()
            logger.info(
                f"Skipping unsubscribed address: {notification.recipient_address}")
            return {"success": False, "notification_id": str(notification_id), "reason": "unsubscribed"}

        notification.status = Notification.Status.PROCESSING
        notification.save()

        try:
            # Get message content
            message_body = notification.metadata.get('message', '')
            
            # Check if this is a template-based notification (HTML content)
            is_template = notification.notification_template is not None
            
            if is_template:
                # Send as HTML email for template-based notifications
                # Use message_body as both plain text fallback and HTML content
                email_service = EmailService(
                    subject=notification.subject,
                    body=message_body,  # Plain text fallback (will be auto-stripped)
                    receiver_email=notification.recipient_address,
                    html_body=message_body  # HTML version
                )
            else:
                # Send as plain text for direct notifications
                # Pass message_body as body only, no html_body parameter
                email_service = EmailService(
                    subject=notification.subject,
                    body=message_body,
                    receiver_email=notification.recipient_address
                )
            
            # Send the email
            email_service.send()

            notification.status = Notification.Status.DELIVERED
            notification.sent_at = timezone.now()
            notification.cost = 0.01  # Cost per email
            notification.save()

            logger.info(
                f"Email sent successfully to {notification.recipient_address}")
            return {"success": True, "notification_id": str(notification_id)}

        except Exception as e:
            notification.status = Notification.Status.FAILED
            notification.failure_reason = str(e)
            notification.retry_count += 1
            notification.save()
            logger.error(
                f"Failed to send email to {notification.recipient_address}. Error: {e}")
            return {"success": False, "notification_id": str(notification_id), "reason": str(e)}

    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} not found.")
        return {"success": False, "notification_id": str(notification_id), "reason": "not_found"}
    except Exception as e:
        logger.error(
            f"Unexpected error processing notification {notification_id}. Error: {e}")
        return {"success": False, "notification_id": str(notification_id), "reason": str(e)}


@shared_task
def process_notification_request_task(request_id):
    """
    Process a notification request by creating and queuing all notifications.
    Handles batch processing and error recovery.
    """
    try:
        notification_request = NotificationRequest.objects.get(id=request_id)
        notification_request.status = NotificationRequest.RequestStatus.PROCESSING
        notification_request.save()

        # Get all pending notifications for this request
        notifications = Notification.objects.filter(
            notification_request=notification_request,
            status=Notification.Status.PENDING
        )

        # Process notifications in batches of 10
        batch_size = 10
        notification_ids = list(notifications.values_list('id', flat=True))

        for i in range(0, len(notification_ids), batch_size):
            batch = notification_ids[i:i + batch_size]
            # Queue all notifications in this batch
            job = group(send_email_notification_task.s(str(notif_id))
                        for notif_id in batch)
            job.apply_async()
            logger.info(
                f"Queued batch of {len(batch)} notifications for request {request_id}")

        # Update request with final counts after all tasks complete
        # This will be called by a callback after all notifications are processed
        finalize_notification_request.apply_async(
            (str(request_id),), countdown=60)

    except NotificationRequest.DoesNotExist:
        logger.error(f"NotificationRequest with id {request_id} not found.")
    except Exception as e:
        logger.error(
            f"Error processing notification request {request_id}. Error: {e}")
        if 'notification_request' in locals():
            notification_request.status = NotificationRequest.RequestStatus.FAILED
            notification_request.save()


@shared_task
def finalize_notification_request(request_id):
    """
    Finalize a notification request by updating counts and sending webhook callback.
    """
    try:
        notification_request = NotificationRequest.objects.get(id=request_id)

        # Count successful and failed notifications
        notifications = Notification.objects.filter(
            notification_request=notification_request)
        successful = notifications.filter(
            status=Notification.Status.DELIVERED).count()
        failed = notifications.filter(
            status=Notification.Status.FAILED).count()
        pending = notifications.filter(
            status__in=[Notification.Status.PENDING, Notification.Status.PROCESSING]).count()

        notification_request.successful_count = successful
        notification_request.failed_count = failed

        # Determine final status
        if pending > 0:
            # Still processing, check again later
            finalize_notification_request.apply_async(
                (request_id,), countdown=30)
            return
        elif failed == 0:
            notification_request.status = NotificationRequest.RequestStatus.COMPLETED
        elif successful == 0:
            notification_request.status = NotificationRequest.RequestStatus.FAILED
        else:
            notification_request.status = NotificationRequest.RequestStatus.PARTIAL

        notification_request.completed_at = timezone.now()
        notification_request.save()

        # Send webhook callback if URL provided
        if notification_request.webhook_url:
            send_webhook_callback.delay(str(request_id))

        logger.info(
            f"Finalized notification request {request_id}. Status: {notification_request.status}")

    except NotificationRequest.DoesNotExist:
        logger.error(f"NotificationRequest with id {request_id} not found.")
    except Exception as e:
        logger.error(
            f"Error finalizing notification request {request_id}. Error: {e}")


@shared_task(bind=True, max_retries=3)
def send_webhook_callback(self, request_id):
    """
    Send webhook callback to the service with notification results.
    Includes list of failed notifications for retry.
    """
    try:
        notification_request = NotificationRequest.objects.get(id=request_id)

        # Get failed notifications
        failed_notifications = Notification.objects.filter(
            notification_request=notification_request,
            status=Notification.Status.FAILED
        )

        failed_list = [
            {
                "recipient_name": notif.recipient_name,
                "recipient_email": notif.recipient_address,
                "failure_reason": notif.failure_reason,
                "notification_id": str(notif.id)
            }
            for notif in failed_notifications
        ]

        payload = {
            "request_id": str(notification_request.id),
            "status": notification_request.status,
            "request_type": notification_request.request_type,
            "total_recipients": notification_request.total_recipients,
            "successful_count": notification_request.successful_count,
            "failed_count": notification_request.failed_count,
            "failed_notifications": failed_list,
            "completed_at": notification_request.completed_at.isoformat() if notification_request.completed_at else None,
            "metadata": notification_request.metadata
        }

        response = requests.post(
            notification_request.webhook_url,
            json=payload,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )

        notification_request.webhook_sent = True
        notification_request.webhook_sent_at = timezone.now()
        notification_request.webhook_response = {
            "status_code": response.status_code,
            "response": response.text[:500]  # Store first 500 chars
        }
        notification_request.save()

        logger.info(
            f"Webhook sent for request {request_id} to {notification_request.webhook_url}")

    except requests.RequestException as e:
        logger.error(
            f"Failed to send webhook for request {request_id}. Error: {e}")
        # Retry the task
        try:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        except self.MaxRetriesExceededError:
            logger.error(
                f"Max retries exceeded for webhook callback {request_id}")
            if 'notification_request' in locals():
                notification_request.webhook_response = {"error": str(e)}
                notification_request.save()
    except NotificationRequest.DoesNotExist:
        logger.error(f"NotificationRequest with id {request_id} not found.")
    except Exception as e:
        logger.error(
            f"Unexpected error sending webhook for request {request_id}. Error: {e}")


@shared_task
def send_notification_task(notification_id):
    """Legacy task for backward compatibility"""
    return send_email_notification_task(notification_id)


@shared_task
def process_batch_task(batch_id):
    """
    Finds all notifications in a batch and queues them for sending.
    """
    try:
        batch = Batch.objects.get(id=batch_id)
        batch.status = 'PROCESSING'
        batch.save()

        notifications_to_send = Notification.objects.filter(batch=batch)

        for notification in notifications_to_send:
            send_email_notification_task.delay(str(notification.id))
            logger.info(
                f"Queued notification {notification.id} for batch {batch.id}")

        batch.status = 'COMPLETED'
        batch.completed_at = timezone.now()
        batch.save()
        logger.info(f"Batch {batch.id} processing complete.")

        # If a callback URL was provided for the batch, send a status update.
        if batch.callback_url:
            try:
                payload = {
                    "batch_id": str(batch.id),
                    "status": batch.status,
                    "completed_at": batch.completed_at.isoformat()
                }
                requests.post(batch.callback_url, json=payload, timeout=10)
                logger.info(
                    f"Sent callback for batch {batch.id} to {batch.callback_url}")
            except requests.RequestException as e:
                logger.error(
                    f"Failed to send callback for batch {batch.id}. Error: {e}")

    except Batch.DoesNotExist:
        logger.error(f"Batch with id {batch_id} not found.")
