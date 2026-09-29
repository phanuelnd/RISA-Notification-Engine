class AuthenticationStatus:
    """
    Enum-like class for authentication status codes and messages
    """
    # Status codes
    UNVERIFIED_EMAIL = 101
    
    # User-friendly messages
    MESSAGES = {
        UNVERIFIED_EMAIL: "User account is not verified. Please check your email for a verification code."
    }
