"""Davr xarajatlari (period expenses) model for cost estimates."""

from django.db import models


class DavrXarajat(models.Model):
    """A period expense line item in a cost estimate."""

    smeta = models.ForeignKey(
        "smetalar.XarajatlarSmetasi",
        on_delete=models.CASCADE,
        related_name="davr_xarajatlari",
    )
    name = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        ordering = ["id"]
        verbose_name = "Davr xarajati"
        verbose_name_plural = "Davr xarajatlari"

    def __str__(self) -> str:
        return self.name
