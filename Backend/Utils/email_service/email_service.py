import os
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from Utils.custom_exceptions import ValidationException, ServerException
import threading

email_text_type = "text/html"


# create client and send
class EmailService:

    """
    This class is used to send emails.
    It uses Django's EmailMultiAlternatives to send emails with HTML content.
    """

    def __init__(self, subject: str, body: str, receiver_email, html_body: str = None) -> None:
        """
        This function sends an email to the email.

        Args:
            subject (str): This is the email subject
            body (str): This is the plain text content or HTML code for the email
            receiver_email: The recipient's email address, it can be a list or string
            html_body (str, optional): HTML version of the email. If provided, body is used as plain text fallback.

        Raises:
            ValidationException: If the email format is invalid or the address was not found
            ServerException: If there was a server-side error sending the email
        """
        if type(receiver_email) == str:
            receiver_email = [receiver_email]

        try:
            # If html_body is provided, use body as plain text and html_body as HTML
            # Otherwise, treat body as HTML (backward compatibility)
            if html_body:
                plain_text = body
                html_content = html_body
            else:
                plain_text = strip_tags(body)
                html_content = body
            
            email = EmailMultiAlternatives(
                subject,
                plain_text,
                os.environ.get("EMAIL_HOST_USER"),
                receiver_email,
            )
            email.attach_alternative(html_content, email_text_type)
            self.email = email
        except Exception as e:
            raise ServerException(
                message="An error occurred while sending the email",
                errors={'email': [str(e)]}
            )

    def send(self) -> None:
        """
        This function sends the email using the EmailMultiAlternatives instance.

        Raises:
            ServerException: If there was a server-side error sending the email
        """
        try:
            self.email.send()
        except Exception as e:
            raise ServerException(
                message="An error occurred while sending the email",
                errors={'email': [str(e)]}
            )

    def send_async(self) -> None:
        """
        This function sends the email in a separate thread.

        Raises:
            ServerException: If there was a server-side error sending the email
        """
        thread = EmailServiceThread(self)
        thread.start()


class EmailServiceThread(threading.Thread):
    """
    This class is used to send emails in a separate thread.
    It inherits from threading.Thread and overrides the run method.
    """

    def __init__(self, email: EmailService):
        super().__init__()
        self.email = email

    def run(self):
        """
        This method is called when the thread is started.
        It sends the email using the EmailService instance.
        """
        try:
            self.email.send()
        except Exception as e:
            raise ServerException(
                message="An error occurred while sending the email",
                errors={'email': [str(e)]}
            )
