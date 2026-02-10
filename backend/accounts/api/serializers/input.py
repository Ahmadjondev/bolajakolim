"""Input serializers for accounts API."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """Serializer for email-based user registration.

    Args/Fields:
        email: User's email address.
        password: Password (min 8 chars).
        first_name: Optional first name.
        last_name: Optional last name.
    """

    email = serializers.EmailField()
    password = serializers.CharField(
        min_length=8,
        write_only=True,
    )
    first_name = serializers.CharField(
        max_length=150,
        required=False,
        default="",
    )
    last_name = serializers.CharField(
        max_length=150,
        required=False,
        default="",
    )

    def validate_email(self, value: str) -> str:
        """Ensure the email is not already registered.

        Args:
            value: Email address to validate.

        Returns:
            Lowered email string.

        Raises:
            serializers.ValidationError: If email is taken.
        """
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Bu email allaqachon ro'yxatdan o'tgan.")
        return value.lower()


class LoginSerializer(serializers.Serializer):
    """Serializer for email/password login.

    Args/Fields:
        email: User's email address.
        password: User password.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class GoogleLoginSerializer(serializers.Serializer):
    """Serializer for Google OAuth login.

    Args/Fields:
        id_token: Google ID token from frontend.
    """

    id_token = serializers.CharField()
