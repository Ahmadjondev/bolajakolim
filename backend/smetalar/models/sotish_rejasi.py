"""Sotish rejasi (sales plan) models for cost estimates."""

from django.db import models


class SotishRejasiYil(models.Model):
    """A year in the sales plan."""

    smeta = models.ForeignKey(
        "smetalar.XarajatlarSmetasi",
        on_delete=models.CASCADE,
        related_name="sotish_rejasi_yillari",
    )
    year = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["year"]
        unique_together = [("smeta", "year")]
        verbose_name = "Sotish rejasi yili"
        verbose_name_plural = "Sotish rejasi yillari"

    def __str__(self) -> str:
        return f"{self.year}-yil"


class SotishMahsulot(models.Model):
    """A product line in a sales plan year."""

    sotish_rejasi_yil = models.ForeignKey(
        SotishRejasiYil,
        on_delete=models.CASCADE,
        related_name="products",
    )
    name = models.CharField(max_length=500)
    unit = models.CharField(max_length=50)
    quantity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        ordering = ["id"]
        verbose_name = "Sotish mahsuloti"
        verbose_name_plural = "Sotish mahsulotlari"

    def __str__(self) -> str:
        return self.name

    @property
    def total_revenue(self) -> float:
        """Calculate total revenue for this product line.

        Returns:
            quantity * price
        """
        return self.quantity * float(self.price)
