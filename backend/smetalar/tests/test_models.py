"""Tests for smetalar models."""

import pytest
from django.contrib.auth import get_user_model

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

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture()
def user() -> User:  # type: ignore[valid-type]
    """Create a test user."""
    return User.objects.create_user(
        email="smeta@example.com",
        password="testpass123",
    )


@pytest.fixture()
def smeta(user: User) -> XarajatlarSmetasi:  # type: ignore[valid-type]
    """Create a test smeta."""
    return XarajatlarSmetasi.objects.create(
        user=user,
        project_name="Test Loyiha",
        organization_name="Test Org",
        project_duration_years=2,
        status="draft",
    )


class TestXarajatlarSmetasi:
    """Tests for the XarajatlarSmetasi model."""

    def test_str(self, smeta: XarajatlarSmetasi) -> None:
        """String representation includes name and status."""
        assert "Test Loyiha" in str(smeta)
        assert "Qoralama" in str(smeta)

    def test_default_status(self, user: User) -> None:  # type: ignore[valid-type]
        """Default status is draft."""
        s = XarajatlarSmetasi.objects.create(
            user=user,
            project_name="New",
        )
        assert s.status == "draft"


class TestEmployee:
    """Tests for the Employee model."""

    def test_total_salary(self, smeta: XarajatlarSmetasi) -> None:
        """Total salary is count * monthly * months."""
        emp = Employee.objects.create(
            smeta=smeta,
            staff_type="management",
            position="Manager",
            count=2,
            monthly_salary=5_000_000,
            duration_months=10,
            financing_source="vazirlik",
        )
        assert emp.total_salary == 2 * 5_000_000 * 10


class TestInventoryItem:
    """Tests for the InventoryItem model."""

    def test_total_price(self, smeta: XarajatlarSmetasi) -> None:
        """Total price is price * quantity."""
        item = InventoryItem.objects.create(
            smeta=smeta,
            name="Laptop",
            unit="dona",
            quantity=3,
            price=15_000_000,
            financing_source="vazirlik",
        )
        assert item.total_price == 3 * 15_000_000


class TestDavrXarajat:
    """Tests for the DavrXarajat model."""

    def test_str(self, smeta: XarajatlarSmetasi) -> None:
        """String representation is the name."""
        d = DavrXarajat.objects.create(
            smeta=smeta,
            name="Ijara",
            amount=1_000,
        )
        assert str(d) == "Ijara"


class TestSotishRejasi:
    """Tests for SotishRejasiYil and SotishMahsulot."""

    def test_total_revenue(self, smeta: XarajatlarSmetasi) -> None:
        """Product revenue is quantity * price."""
        yil = SotishRejasiYil.objects.create(smeta=smeta, year=1)
        m = SotishMahsulot.objects.create(
            sotish_rejasi_yil=yil,
            name="Product A",
            unit="dona",
            quantity=100,
            price=50_000,
        )
        assert m.total_revenue == 100 * 50_000
