"""Authentication services for accounts app."""

import logging
from typing import Any

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

User = get_user_model()


def get_tokens_for_user(user: Any) -> dict[str, str]:
    """Generate JWT access and refresh tokens for a user.

    Args:
        user: The User instance.

    Returns:
        Dict with 'access' and 'refresh' token strings.
    """
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def register_user(
    email: str,
    password: str,
    first_name: str = "",
    last_name: str = "",
) -> dict[str, Any]:
    """Register a new user with email and password.

    Args:
        email: User email.
        password: Raw password.
        first_name: Optional first name.
        last_name: Optional last name.

    Returns:
        Dict with 'tokens' and 'user' keys.
    """
    user = User.objects.create_user(
        email=email.lower(),
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    tokens = get_tokens_for_user(user)
    return {"tokens": tokens, "user": user}


def login_user(email: str, password: str) -> dict[str, Any] | None:
    """Authenticate a user with email and password.

    Args:
        email: User email.
        password: Raw password.

    Returns:
        Dict with 'tokens' and 'user' or None if invalid.
    """
    user = authenticate(email=email.lower(), password=password)
    if user is None:
        return None
    tokens = get_tokens_for_user(user)
    return {"tokens": tokens, "user": user}


def google_login(token: str) -> dict[str, Any] | None:
    """Authenticate or register a user via Google ID token.

    Args:
        token: Google ID token string from the frontend.

    Returns:
        Dict with 'tokens' and 'user' or None on failure.
    """
    try:
        idinfo = google_id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.SOCIALACCOUNT_PROVIDERS["google"]["APP"]["client_id"],
        )
    except Exception:
        logger.error("Google token tekshirishda xatolik", exc_info=True)
        return None

    email: str = idinfo.get("email", "")
    if not email:
        return None

    user, _ = User.objects.get_or_create(
        email=email.lower(),
        defaults={
            "first_name": idinfo.get("given_name", ""),
            "last_name": idinfo.get("family_name", ""),
            "avatar_url": idinfo.get("picture", ""),
        },
    )
    # Update avatar if changed
    picture = idinfo.get("picture", "")
    if picture and user.avatar_url != picture:
        user.avatar_url = picture
        user.save(update_fields=["avatar_url"])

    tokens = get_tokens_for_user(user)
    return {"tokens": tokens, "user": user}
