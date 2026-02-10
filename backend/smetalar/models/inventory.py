"""Inventory (Inventar) model for cost estimates."""

from django.db import models

from smetalar.models.salary import FinancingSource


class InventoryItem(models.Model):
    """An equipment/inventory line item in a cost estimate.

    Tracks name, description, purchase link, quantity,
    unit price, and financing source.
    """

    smeta = models.ForeignKey(
        "smetalar.XarajatlarSmetasi",
        on_delete=models.CASCADE,
        related_name="inventory_items",
    )
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    link = models.URLField(max_length=1000, blank=True)
    unit = models.CharField(max_length=50, default="dona")
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=15, decimal_places=2)
    financing_source = models.CharField(
        max_length=20,
        choices=FinancingSource.choices,
        default=FinancingSource.VAZIRLIK,
    )

    class Meta:
        ordering = ["id"]
        verbose_name = "Inventar"
        verbose_name_plural = "Inventarlar"

    def __str__(self) -> str:
        return self.name

    @property
    def total_price(self) -> float:
        """Calculate total cost of this line item.

        Returns:
            price * quantity
        """
        return float(self.price) * self.quantity
