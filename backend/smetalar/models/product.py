"""Product (Mahsulot) model for cost estimates."""

from django.db import models


class Product(models.Model):
    """A product/output line item in a cost estimate."""

    smeta = models.ForeignKey(
        "smetalar.XarajatlarSmetasi",
        on_delete=models.CASCADE,
        related_name="products",
    )
    name = models.CharField(max_length=500)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["id"]
        verbose_name = "Mahsulot"
        verbose_name_plural = "Mahsulotlar"

    def __str__(self) -> str:
        return self.name
