"""Output (read) serializers for smetalar API."""

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


class EmployeeOutputSerializer(serializers.ModelSerializer):
    """Read serializer for Employee."""

    class Meta:
        model = Employee
        fields = [
            "id",
            "staff_type",
            "position",
            "count",
            "monthly_salary",
            "duration_months",
            "financing_source",
            "total_salary",
        ]
        read_only_fields = fields


class InventoryItemOutputSerializer(serializers.ModelSerializer):
    """Read serializer for InventoryItem."""

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "name",
            "description",
            "link",
            "unit",
            "quantity",
            "price",
            "financing_source",
            "total_price",
        ]
        read_only_fields = fields


class RawMaterialOutputSerializer(serializers.ModelSerializer):
    """Read serializer for RawMaterial."""

    class Meta:
        model = RawMaterial
        fields = [
            "id",
            "name",
            "unit",
            "quantity",
            "price",
            "financing_source",
            "total_price",
        ]
        read_only_fields = fields


class OtherExpenseOutputSerializer(serializers.ModelSerializer):
    """Read serializer for OtherExpense."""

    class Meta:
        model = OtherExpense
        fields = [
            "id",
            "expense_type",
            "name",
            "unit",
            "quantity",
            "price",
            "financing_source",
            "total_price",
        ]
        read_only_fields = fields


class ProductOutputSerializer(serializers.ModelSerializer):
    """Read serializer for Product."""

    class Meta:
        model = Product
        fields = ["id", "name", "quantity"]
        read_only_fields = fields


class DavrXarajatOutputSerializer(serializers.ModelSerializer):
    """Read serializer for DavrXarajat."""

    class Meta:
        model = DavrXarajat
        fields = ["id", "name", "amount"]
        read_only_fields = fields


class SotishMahsulotOutputSerializer(serializers.ModelSerializer):
    """Read serializer for SotishMahsulot."""

    class Meta:
        model = SotishMahsulot
        fields = ["id", "name", "unit", "quantity", "price"]
        read_only_fields = fields


class SotishRejasiYilOutputSerializer(serializers.ModelSerializer):
    """Read serializer for SotishRejasiYil with nested products."""

    products = SotishMahsulotOutputSerializer(many=True, read_only=True)

    class Meta:
        model = SotishRejasiYil
        fields = ["id", "year", "products"]
        read_only_fields = fields


# -------- Grouped outputs matching frontend shape --------
class SalaryDataOutputSerializer(serializers.Serializer):
    """Grouped salary output matching frontend SalaryData shape."""

    management_staff = EmployeeOutputSerializer(many=True)
    production_staff = EmployeeOutputSerializer(many=True)


class OtherExpensesDataOutputSerializer(serializers.Serializer):
    """Grouped other-expenses output matching frontend shape."""

    management_expenses = OtherExpenseOutputSerializer(many=True)
    production_expenses = OtherExpenseOutputSerializer(many=True)


# -------- Full Smeta output --------
class SmetaListSerializer(serializers.ModelSerializer):
    """Lightweight smeta serializer for list/dashboard views."""

    grand_total = serializers.FloatField(read_only=True)

    class Meta:
        model = XarajatlarSmetasi
        fields = [
            "id",
            "project_name",
            "organization_name",
            "status",
            "grand_total",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class SmetaDetailSerializer(serializers.ModelSerializer):
    """Full smeta serializer with all nested data."""

    salary = serializers.SerializerMethodField()
    inventory = InventoryItemOutputSerializer(
        source="inventory_items",
        many=True,
        read_only=True,
    )
    raw_materials = RawMaterialOutputSerializer(
        many=True,
        read_only=True,
    )
    other_expenses = serializers.SerializerMethodField()
    products = ProductOutputSerializer(many=True, read_only=True)
    davr_xarajatlari = DavrXarajatOutputSerializer(
        many=True,
        read_only=True,
    )
    sotish_rejasi = SotishRejasiYilOutputSerializer(
        source="sotish_rejasi_yillari",
        many=True,
        read_only=True,
    )
    grand_total = serializers.SerializerMethodField()
    excel_file_url = serializers.SerializerMethodField()

    class Meta:
        model = XarajatlarSmetasi
        fields = [
            "id",
            "project_name",
            "organization_name",
            "project_description",
            "project_duration_years",
            "status",
            "salary",
            "inventory",
            "raw_materials",
            "other_expenses",
            "products",
            "davr_xarajatlari",
            "sotish_rejasi",
            "grand_total",
            "excel_file_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_salary(self, obj: XarajatlarSmetasi) -> dict:
        """Group employees by staff type.

        Args:
            obj: XarajatlarSmetasi instance.

        Returns:
            Dict with management_staff and production_staff.
        """
        employees = obj.employees.all()
        return {
            "management_staff": EmployeeOutputSerializer(
                [e for e in employees if e.staff_type == "management"],
                many=True,
            ).data,
            "production_staff": EmployeeOutputSerializer(
                [e for e in employees if e.staff_type == "production"],
                many=True,
            ).data,
        }

    def get_other_expenses(self, obj: XarajatlarSmetasi) -> dict:
        """Group other expenses by expense type.

        Args:
            obj: XarajatlarSmetasi instance.

        Returns:
            Dict with management_expenses, production_expenses.
        """
        expenses = obj.other_expenses.all()
        return {
            "management_expenses": OtherExpenseOutputSerializer(
                [e for e in expenses if e.expense_type == "management"],
                many=True,
            ).data,
            "production_expenses": OtherExpenseOutputSerializer(
                [e for e in expenses if e.expense_type == "production"],
                many=True,
            ).data,
        }

    def get_grand_total(self, obj: XarajatlarSmetasi) -> float:
        """Calculate the total expenses for this smeta.

        Args:
            obj: XarajatlarSmetasi instance.

        Returns:
            Grand total in so'm.
        """
        from smetalar.services.smeta_service import calculate_grand_total

        return calculate_grand_total(obj)

    def get_excel_file_url(
        self,
        obj: XarajatlarSmetasi,
    ) -> str | None:
        """Return the URL of the generated Excel file.

        Args:
            obj: XarajatlarSmetasi instance.

        Returns:
            URL string or None if not generated yet.
        """
        if obj.excel_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.excel_file.url)
            return obj.excel_file.url
        return None
