"""Raw materials (Xom ashyo) model for cost estimates."""

from django.db import models

from smetalar.models.salary import FinancingSource


class RawMaterial(models.Model):
    """A raw material line item in a cost estimate."""

    smeta = models.ForeignKey(
        "smetalar.XarajatlarSmetasi",
        on_delete=models.CASCADE,
        related_name="raw_materials",
    )
    name = models.CharField(max_length=500)
    unit = models.CharField(max_length=50)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=15, decimal_places=2)
    financing_source = models.CharField(
        max_length=20,
        choices=FinancingSource.choices,
        default=FinancingSource.VAZIRLIK,
    )

    class Meta:
        ordering = ["id"]
        verbose_name = "Xom ashyo"
        verbose_name_plural = "Xom ashyolar"

    def __str__(self) -> str:
        return self.name

    @property
    def total_price(self) -> float:
        """Calculate total cost.

        Returns:
            price * quantity
        """
        return float(self.price) * self.quantity
