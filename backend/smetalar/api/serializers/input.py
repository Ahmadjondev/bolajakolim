"""Input (write) serializers for smetalar API."""

from rest_framework import serializers

from smetalar.models import (
    DavrXarajat,
    Employee,
    InventoryItem,
    OtherExpense,
    Product,
    RawMaterial,
    SotishMahsulot,
    SotishRejasiYil,
    XarajatlarSmetasi,
)


# ------------------------------------------------------------------ Nested
# ------------------------------------------------------------------ items
class EmployeeInputSerializer(serializers.Serializer):
    """Write serializer for an employee entry.

    Fields:
        staff_type, position, count, monthly_salary,
        duration_months, financing_source.
    """

    staff_type = serializers.ChoiceField(
        choices=["management", "production"],
        required=False,
        default="management",
    )
    position = serializers.CharField(max_length=300)
    count = serializers.IntegerField(min_value=1)
    monthly_salary = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    duration_months = serializers.IntegerField(min_value=1, max_value=120)
    financing_source = serializers.ChoiceField(
        choices=["vazirlik", "tashkilot"],
    )


class InventoryItemInputSerializer(serializers.Serializer):
    """Write serializer for an inventory item.

    Fields:
        name, description, link, unit, quantity, price,
        financing_source.
    """

    name = serializers.CharField(max_length=500)
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )
    link = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )
    unit = serializers.CharField(max_length=50, default="dona")
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=15, decimal_places=2)
    financing_source = serializers.ChoiceField(
        choices=["vazirlik", "tashkilot"],
    )


class RawMaterialInputSerializer(serializers.Serializer):
    """Write serializer for a raw material.

    Fields:
        name, unit, quantity, price, financing_source.
    """

    name = serializers.CharField(max_length=500)
    unit = serializers.CharField(max_length=50)
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=15, decimal_places=2)
    financing_source = serializers.ChoiceField(
        choices=["vazirlik", "tashkilot"],
    )


class OtherExpenseInputSerializer(serializers.Serializer):
    """Write serializer for an other-expense item.

    Fields:
        expense_type, name, unit, quantity, price,
        financing_source.
    """

    expense_type = serializers.ChoiceField(
        choices=["management", "production"],
        required=False,
        default="management",
    )
    name = serializers.CharField(max_length=500)
    unit = serializers.CharField(max_length=50)
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=15, decimal_places=2)
    financing_source = serializers.ChoiceField(
        choices=["vazirlik", "tashkilot"],
    )


class ProductInputSerializer(serializers.Serializer):
    """Write serializer for a product line.

    Fields:
        name, quantity.
    """

    name = serializers.CharField(max_length=500)
    quantity = serializers.IntegerField(min_value=1)


class DavrXarajatInputSerializer(serializers.Serializer):
    """Write serializer for a period expense.

    Fields:
        name, amount.
    """

    name = serializers.CharField(max_length=500)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)


class SotishMahsulotInputSerializer(serializers.Serializer):
    """Write serializer for a sales plan product.

    Fields:
        name, unit, quantity, price.
    """

    name = serializers.CharField(max_length=500)
    unit = serializers.CharField(max_length=50)
    quantity = serializers.IntegerField(min_value=0)
    price = serializers.DecimalField(max_digits=15, decimal_places=2)


class SotishRejasiYilInputSerializer(serializers.Serializer):
    """Write serializer for a year in the sales plan.

    Fields:
        year, products.
    """

    year = serializers.IntegerField(min_value=1)
    products = SotishMahsulotInputSerializer(many=True)


# ------------------------------------------------------------------ Salary
# nested grouping (matches frontend SalaryData shape)
class SalaryDataInputSerializer(serializers.Serializer):
    """Grouped salary input matching frontend SalaryData.

    Fields:
        management_staff, production_staff.
    """

    management_staff = EmployeeInputSerializer(many=True, required=False)
    production_staff = EmployeeInputSerializer(many=True, required=False)


class OtherExpensesDataInputSerializer(serializers.Serializer):
    """Grouped other-expenses input matching frontend.

    Fields:
        management_expenses, production_expenses.
    """

    management_expenses = OtherExpenseInputSerializer(
        many=True,
        required=False,
    )
    production_expenses = OtherExpenseInputSerializer(
        many=True,
        required=False,
    )


# ------------------------------------------------------------------ Top level
class SmetaCreateSerializer(serializers.Serializer):
    """Write serializer for creating/updating a full Xarajatlar Smetasi.

    Fields:
        project_info, salary, inventory, raw_materials,
        other_expenses, products, davr_xarajatlari,
        sotish_rejasi, status.
    """

    # Project info (flat)
    project_name = serializers.CharField(max_length=300)
    organization_name = serializers.CharField(
        max_length=300,
        required=False,
        allow_blank=True,
        default="",
    )
    project_description = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )
    project_duration_years = serializers.IntegerField(
        min_value=1,
        max_value=10,
        default=2,
    )

    # Nested data
    salary = SalaryDataInputSerializer(required=False)
    inventory = InventoryItemInputSerializer(many=True, required=False)
    raw_materials = RawMaterialInputSerializer(many=True, required=False)
    other_expenses = OtherExpensesDataInputSerializer(required=False)
    products = ProductInputSerializer(many=True, required=False)
    davr_xarajatlari = DavrXarajatInputSerializer(
        many=True,
        required=False,
    )
    sotish_rejasi = SotishRejasiYilInputSerializer(
        many=True,
        required=False,
    )

    # Status
    status = serializers.ChoiceField(
        choices=["draft", "completed"],
        default="draft",
    )
