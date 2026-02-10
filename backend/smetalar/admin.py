"""Admin configuration for smetalar app."""

from django.contrib import admin

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


class EmployeeInline(admin.TabularInline):
    """Inline admin for Employee entries."""

    model = Employee
    extra = 0


class InventoryItemInline(admin.TabularInline):
    """Inline admin for InventoryItem entries."""

    model = InventoryItem
    extra = 0


class RawMaterialInline(admin.TabularInline):
    """Inline admin for RawMaterial entries."""

    model = RawMaterial
    extra = 0


class OtherExpenseInline(admin.TabularInline):
    """Inline admin for OtherExpense entries."""

    model = OtherExpense
    extra = 0


class ProductInline(admin.TabularInline):
    """Inline admin for Product entries."""

    model = Product
    extra = 0


class DavrXarajatInline(admin.TabularInline):
    """Inline admin for DavrXarajat entries."""

    model = DavrXarajat
    extra = 0


@admin.register(XarajatlarSmetasi)
class XarajatlarSmetasiAdmin(admin.ModelAdmin):
    """Admin interface for the XarajatlarSmetasi model."""

    list_display = (
        "project_name",
        "organization_name",
        "user",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("project_name", "organization_name")
    readonly_fields = ("created_at", "updated_at")
    inlines = [
        EmployeeInline,
        InventoryItemInline,
        RawMaterialInline,
        OtherExpenseInline,
        ProductInline,
        DavrXarajatInline,
    ]
