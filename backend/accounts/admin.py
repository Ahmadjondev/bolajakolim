"""Admin configuration for accounts app."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for the custom User model."""

    list_display = ("email", "first_name", "last_name", "is_staff")
    list_filter = ("is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Shaxsiy", {"fields": ("first_name", "last_name", "avatar_url")}),
        (
            "Ruxsatlar",
            {"fields": ("is_active", "is_staff", "is_superuser")},
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                ),
            },
        ),
    )
