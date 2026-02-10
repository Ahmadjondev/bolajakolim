"""Business logic services for smetalar app."""

import logging
from decimal import Decimal
from typing import Any

from django.db import transaction

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

logger = logging.getLogger(__name__)

SOCIAL_TAX_RATE = Decimal("0.12")


def calculate_grand_total(smeta: XarajatlarSmetasi) -> float:
    """Calculate the grand total expenses for a smeta.

    Mirrors the frontend calculateGrandTotals logic:
    grandTotal = ishHaqiFondi + ijtimoiySoliq + xomashyo
                 + inventar + boshqaXarajatlar

    Args:
        smeta: The XarajatlarSmetasi instance.

    Returns:
        Grand total in so'm as a float.
    """
    employees = smeta.employees.all()
    salary_total = sum(
        float(e.monthly_salary) * e.count * e.duration_months for e in employees
    )
    social_tax = salary_total * float(SOCIAL_TAX_RATE)

    inventory_total = sum(
        float(i.price) * i.quantity for i in smeta.inventory_items.all()
    )
    raw_materials_total = sum(
        float(r.price) * r.quantity for r in smeta.raw_materials.all()
    )
    other_expenses_total = sum(
        float(o.price) * o.quantity for o in smeta.other_expenses.all()
    )
    return (
        salary_total
        + social_tax
        + inventory_total
        + (raw_materials_total + other_expenses_total)
    )


@transaction.atomic
def create_smeta(
    user: Any,
    data: dict[str, Any],
) -> XarajatlarSmetasi:
    """Create a full Xarajatlar Smetasi with all nested items.

    Args:
        user: The authenticated user.
        data: Validated data from SmetaCreateSerializer.

    Returns:
        The created XarajatlarSmetasi instance.
    """
    smeta = XarajatlarSmetasi.objects.create(
        user=user,
        project_name=data["project_name"],
        organization_name=data.get("organization_name", ""),
        project_description=data.get("project_description", ""),
        project_duration_years=data.get("project_duration_years", 2),
        status=data.get("status", "draft"),
    )
    _create_nested_items(smeta, data)
    return smeta


@transaction.atomic
def update_smeta(
    smeta: XarajatlarSmetasi,
    data: dict[str, Any],
) -> XarajatlarSmetasi:
    """Update a full Xarajatlar Smetasi, replacing all nested items.

    Supports partial updates — only sections present in data are replaced.

    Args:
        smeta: Existing smeta instance to update.
        data: Validated data from SmetaCreateSerializer.

    Returns:
        The updated XarajatlarSmetasi instance.
    """
    if "project_name" in data:
        smeta.project_name = data["project_name"]
    if "organization_name" in data:
        smeta.organization_name = data["organization_name"]
    if "project_description" in data:
        smeta.project_description = data["project_description"]
    if "project_duration_years" in data:
        smeta.project_duration_years = data["project_duration_years"]
    if "status" in data:
        smeta.status = data["status"]
    smeta.save()

    # Delete and recreate nested items for sections present in data
    if "salary" in data:
        smeta.employees.all().delete()
    if "inventory" in data:
        smeta.inventory_items.all().delete()
    if "raw_materials" in data:
        smeta.raw_materials.all().delete()
    if "other_expenses" in data:
        smeta.other_expenses.all().delete()
    if "products" in data:
        smeta.products.all().delete()
    if "davr_xarajatlari" in data:
        smeta.davr_xarajatlari.all().delete()
    if "sotish_rejasi" in data:
        smeta.sotish_rejasi_yillari.all().delete()

    _create_nested_items(smeta, data)
    return smeta


def _create_nested_items(
    smeta: XarajatlarSmetasi,
    data: dict[str, Any],
) -> None:
    """Bulk-create all nested items for a smeta.

    Args:
        smeta: The parent smeta instance.
        data: Validated data containing nested item lists.
    """
    # Employees
    salary_data = data.get("salary", {})
    employee_objs: list[Employee] = []
    for emp in salary_data.get("management_staff", []):
        employee_objs.append(
            Employee(
                smeta=smeta,
                staff_type="management",
                position=emp["position"],
                count=emp["count"],
                monthly_salary=emp["monthly_salary"],
                duration_months=emp["duration_months"],
                financing_source=emp["financing_source"],
            )
        )
    for emp in salary_data.get("production_staff", []):
        employee_objs.append(
            Employee(
                smeta=smeta,
                staff_type="production",
                position=emp["position"],
                count=emp["count"],
                monthly_salary=emp["monthly_salary"],
                duration_months=emp["duration_months"],
                financing_source=emp["financing_source"],
            )
        )
    if employee_objs:
        Employee.objects.bulk_create(employee_objs)

    # Inventory
    inventory_data = data.get("inventory", [])
    if inventory_data:
        InventoryItem.objects.bulk_create(
            [
                InventoryItem(
                    smeta=smeta,
                    name=item["name"],
                    description=item.get("description", ""),
                    link=item.get("link", ""),
                    unit=item.get("unit", "dona"),
                    quantity=item["quantity"],
                    price=item["price"],
                    financing_source=item["financing_source"],
                )
                for item in inventory_data
            ]
        )

    # Raw materials
    raw_materials = data.get("raw_materials", [])
    if raw_materials:
        RawMaterial.objects.bulk_create(
            [
                RawMaterial(
                    smeta=smeta,
                    name=item["name"],
                    unit=item["unit"],
                    quantity=item["quantity"],
                    price=item["price"],
                    financing_source=item["financing_source"],
                )
                for item in raw_materials
            ]
        )

    # Other expenses
    other_data = data.get("other_expenses", {})
    expense_objs: list[OtherExpense] = []
    for exp in other_data.get("management_expenses", []):
        expense_objs.append(
            OtherExpense(
                smeta=smeta,
                expense_type="management",
                name=exp["name"],
                unit=exp["unit"],
                quantity=exp["quantity"],
                price=exp["price"],
                financing_source=exp["financing_source"],
            )
        )
    for exp in other_data.get("production_expenses", []):
        expense_objs.append(
            OtherExpense(
                smeta=smeta,
                expense_type="production",
                name=exp["name"],
                unit=exp["unit"],
                quantity=exp["quantity"],
                price=exp["price"],
                financing_source=exp["financing_source"],
            )
        )
    if expense_objs:
        OtherExpense.objects.bulk_create(expense_objs)

    # Products
    products = data.get("products", [])
    if products:
        Product.objects.bulk_create(
            [
                Product(
                    smeta=smeta,
                    name=p["name"],
                    quantity=p["quantity"],
                )
                for p in products
            ]
        )

    # Davr xarajatlari
    davr_items = data.get("davr_xarajatlari", [])
    if davr_items:
        DavrXarajat.objects.bulk_create(
            [
                DavrXarajat(
                    smeta=smeta,
                    name=d["name"],
                    amount=d["amount"],
                )
                for d in davr_items
            ]
        )

    # Sotish rejasi
    sotish_years = data.get("sotish_rejasi", [])
    for year_data in sotish_years:
        yil = SotishRejasiYil.objects.create(
            smeta=smeta,
            year=year_data["year"],
        )
        year_products = year_data.get("products", [])
        if year_products:
            SotishMahsulot.objects.bulk_create(
                [
                    SotishMahsulot(
                        sotish_rejasi_yil=yil,
                        name=p["name"],
                        unit=p["unit"],
                        quantity=p["quantity"],
                        price=p["price"],
                    )
                    for p in year_products
                ]
            )
