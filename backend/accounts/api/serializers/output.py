"""Output serializers for accounts API."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation.

    Fields:
        id, email, first_name, last_name, avatar_url,
        full_name, created_at.
    """

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "avatar_url",
            "full_name",
            "created_at",
        ]
        read_only_fields = fields


class TokenSerializer(serializers.Serializer):
    """JWT token pair response.

    Fields:
        access: JWT access token.
        refresh: JWT refresh token.
        user: Nested user data.
    """

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
