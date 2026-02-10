"""Salary (Ish haqi) models for cost estimates."""

from django.db import models


class FinancingSource(models.TextChoices):
    """Funding source for an expense item."""

    VAZIRLIK = "vazirlik", "Vazirlik"
    TASHKILOT = "tashkilot", "Tashkilot"


class StaffType(models.TextChoices):
    """Category of staff."""

    MANAGEMENT = "management", "Ma'muriy-boshqaruv"
    PRODUCTION = "production", "Ishlab chiqarish"


class Employee(models.Model):
    """A salaried employee entry in a cost estimate.

    Tracks position, headcount, salary, duration, and
    financing source for either management or production staff.
    """

    smeta = models.ForeignKey(
        "smetalar.XarajatlarSmetasi",
        on_delete=models.CASCADE,
        related_name="employees",
    )
    staff_type = models.CharField(
        max_length=20,
        choices=StaffType.choices,
    )
    position = models.CharField(max_length=300)
    count = models.PositiveIntegerField(default=1)
    monthly_salary = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    duration_months = models.PositiveSmallIntegerField(default=10)
    financing_source = models.CharField(
        max_length=20,
        choices=FinancingSource.choices,
        default=FinancingSource.VAZIRLIK,
    )

    class Meta:
        ordering = ["staff_type", "id"]
        verbose_name = "Xodim"
        verbose_name_plural = "Xodimlar"

    def __str__(self) -> str:
        return f"{self.position} ({self.get_staff_type_display()})"

    @property
    def total_salary(self) -> float:
        """Calculate total salary cost.

        Returns:
            monthly_salary * count * duration_months
        """
        return float(self.monthly_salary) * self.count * self.duration_months
