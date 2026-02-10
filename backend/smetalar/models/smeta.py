"""Xarajatlar Smetasi (cost estimate) main model."""

from django.conf import settings
from django.db import models


class SmetaStatus(models.TextChoices):
    """Smeta lifecycle status."""

    DRAFT = "draft", "Qoralama"
    COMPLETED = "completed", "Yakunlangan"


class XarajatlarSmetasi(models.Model):
    """Top-level cost estimate document owned by a user.

    Each smeta aggregates project info + all related expense
    categories (salary, inventory, raw materials, etc.).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="smetalar",
    )
    status = models.CharField(
        max_length=20,
        choices=SmetaStatus.choices,
        default=SmetaStatus.DRAFT,
        db_index=True,
    )

    # Project info
    project_name = models.CharField(max_length=300)
    organization_name = models.CharField(max_length=300, blank=True)
    project_description = models.TextField(blank=True)
    project_duration_years = models.PositiveSmallIntegerField(default=2)

    # Excel file (generated)
    excel_file = models.FileField(
        upload_to="smetalar/excel/%Y/%m/",
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Xarajatlar Smetasi"
        verbose_name_plural = "Xarajatlar Smetalari"

    def __str__(self) -> str:
        return f"{self.project_name} ({self.get_status_display()})"
