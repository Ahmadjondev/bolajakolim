"""Custom user model for bolajakolim."""

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


class UserManager(BaseUserManager["User"]):
    """Manager for custom User model with email-based auth."""

    def create_user(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: object,
    ) -> "User":
        """Create and return a regular user.

        Args:
            email: User's email address.
            password: Raw password string.
            **extra_fields: Additional fields for the user.

        Returns:
            Newly created User instance.

        Raises:
            ValueError: If email is not provided.
        """
        if not email:
            raise ValueError("Email maydoni majburiy.")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: object,
    ) -> "User":
        """Create and return a superuser.

        Args:
            email: Superuser's email address.
            password: Raw password string.
            **extra_fields: Additional fields.

        Returns:
            Newly created superuser.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email as the unique identifier."""

    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Foydalanuvchi"
        verbose_name_plural = "Foydalanuvchilar"

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        """Return the user's full name.

        Returns:
            Concatenated first and last name.
        """
        return f"{self.first_name} {self.last_name}".strip()
