"""Tests for smetalar API endpoints."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from smetalar.models import XarajatlarSmetasi

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture()
def api_client() -> APIClient:
    """Return a DRF test client."""
    return APIClient()


@pytest.fixture()
def user() -> User:  # type: ignore[valid-type]
    """Create a test user."""
    return User.objects.create_user(
        email="api@example.com",
        password="testpass123",
    )


@pytest.fixture()
def auth_client(
    api_client: APIClient,
    user: User,  # type: ignore[valid-type]
) -> APIClient:
    """Return an authenticated test client."""
    api_client.force_authenticate(user=user)
    return api_client


def _smeta_payload(
    status_val: str = "draft",
) -> dict:
    """Build a full smeta creation payload."""
    return {
        "project_name": "Test Loyiha",
        "organization_name": "Test Org",
        "project_description": "Test tavsif",
        "project_duration_years": 2,
        "status": status_val,
        "salary": {
            "management_staff": [
                {
                    "staff_type": "management",
                    "position": "Loyiha rahbari",
                    "count": 1,
                    "monthly_salary": "5000000.00",
                    "duration_months": 10,
                    "financing_source": "vazirlik",
                }
            ],
            "production_staff": [
                {
                    "staff_type": "production",
                    "position": "Dasturchi",
                    "count": 3,
                    "monthly_salary": "8000000.00",
                    "duration_months": 10,
                    "financing_source": "vazirlik",
                }
            ],
        },
        "inventory": [
            {
                "name": "MacBook Pro",
                "description": "M3 chip",
                "link": "https://apple.com",
                "unit": "dona",
                "quantity": 4,
                "price": "25000000.00",
                "financing_source": "vazirlik",
            }
        ],
        "raw_materials": [
            {
                "name": "Server xizmati",
                "unit": "oy",
                "quantity": 24,
                "price": "500000.00",
                "financing_source": "tashkilot",
            }
        ],
        "other_expenses": {
            "management_expenses": [
                {
                    "expense_type": "management",
                    "name": "Ofis ijarasi",
                    "unit": "oy",
                    "quantity": 24,
                    "price": "3000000.00",
                    "financing_source": "tashkilot",
                }
            ],
            "production_expenses": [],
        },
        "products": [
            {"name": "Mobile App", "quantity": 1},
            {"name": "Web App", "quantity": 1},
        ],
        "davr_xarajatlari": [
            {"name": "Marketing", "amount": "5000.00"},
            {"name": "Transport", "amount": "2000.00"},
        ],
        "sotish_rejasi": [
            {
                "year": 1,
                "products": [
                    {
                        "name": "Mobile App",
                        "unit": "dona",
                        "quantity": 50,
                        "price": "10000.00",
                    }
                ],
            },
            {
                "year": 2,
                "products": [
                    {
                        "name": "Mobile App",
                        "unit": "dona",
                        "quantity": 100,
                        "price": "10000.00",
                    }
                ],
            },
        ],
    }


class TestSmetaCreate:
    """Tests for POST /api/smetalar/."""

    URL = "/api/smetalar/"

    def test_create_draft(self, auth_client: APIClient) -> None:
        """Create a draft smeta."""
        resp = auth_client.post(
            self.URL,
            _smeta_payload("draft"),
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["status"] == "draft"
        assert resp.data["project_name"] == "Test Loyiha"
        assert len(resp.data["salary"]["management_staff"]) == 1
        assert len(resp.data["salary"]["production_staff"]) == 1
        assert len(resp.data["inventory"]) == 1
        assert len(resp.data["products"]) == 2

    def test_create_completed(self, auth_client: APIClient) -> None:
        """Create a completed smeta triggers Excel generation."""
        resp = auth_client.post(
            self.URL,
            _smeta_payload("completed"),
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["status"] == "completed"

    def test_create_unauthenticated(
        self,
        api_client: APIClient,
    ) -> None:
        """Unauthenticated request returns 401."""
        resp = api_client.post(
            self.URL,
            _smeta_payload(),
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestSmetaList:
    """Tests for GET /api/smetalar/."""

    URL = "/api/smetalar/"

    def test_list_empty(self, auth_client: APIClient) -> None:
        """Empty list returns paginated empty results."""
        resp = auth_client.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0
        assert resp.data["results"] == []

    def test_list_with_data(
        self,
        auth_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """List returns user's smetalar."""
        XarajatlarSmetasi.objects.create(
            user=user,
            project_name="S1",
        )
        XarajatlarSmetasi.objects.create(
            user=user,
            project_name="S2",
        )
        resp = auth_client.get(self.URL)
        assert resp.data["count"] == 2

    def test_list_filter_status(
        self,
        auth_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """Filter by status works."""
        XarajatlarSmetasi.objects.create(
            user=user,
            project_name="Draft",
            status="draft",
        )
        XarajatlarSmetasi.objects.create(
            user=user,
            project_name="Done",
            status="completed",
        )
        resp = auth_client.get(self.URL, {"status": "draft"})
        assert resp.data["count"] == 1
        assert resp.data["results"][0]["project_name"] == "Draft"

    def test_list_search(
        self,
        auth_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """Search by project_name works."""
        XarajatlarSmetasi.objects.create(
            user=user,
            project_name="Alpha",
        )
        XarajatlarSmetasi.objects.create(
            user=user,
            project_name="Beta",
        )
        resp = auth_client.get(self.URL, {"search": "alpha"})
        assert resp.data["count"] == 1

    def test_list_isolation(
        self,
        auth_client: APIClient,
    ) -> None:
        """Users cannot see other users' smetalar."""
        other = User.objects.create_user(
            email="other@x.com",
            password="pass12345",
        )
        XarajatlarSmetasi.objects.create(
            user=other,
            project_name="Other's",
        )
        resp = auth_client.get(self.URL)
        assert resp.data["count"] == 0


class TestSmetaRetrieve:
    """Tests for GET /api/smetalar/{id}/."""

    def test_retrieve(
        self,
        auth_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """Get full smeta detail."""
        auth_client.post(
            "/api/smetalar/",
            _smeta_payload(),
            format="json",
        )
        smeta = XarajatlarSmetasi.objects.first()
        resp = auth_client.get(f"/api/smetalar/{smeta.pk}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["project_name"] == "Test Loyiha"
        assert "salary" in resp.data
        assert "inventory" in resp.data

    def test_retrieve_not_found(
        self,
        auth_client: APIClient,
    ) -> None:
        """Non-existent smeta returns 404."""
        resp = auth_client.get("/api/smetalar/99999/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


class TestSmetaUpdate:
    """Tests for PUT /api/smetalar/{id}/."""

    def test_update(
        self,
        auth_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """Update smeta replaces nested data."""
        auth_client.post(
            "/api/smetalar/",
            _smeta_payload(),
            format="json",
        )
        smeta = XarajatlarSmetasi.objects.first()

        updated = _smeta_payload()
        updated["project_name"] = "Updated Name"
        updated["products"] = [{"name": "Single Product", "quantity": 5}]

        resp = auth_client.put(
            f"/api/smetalar/{smeta.pk}/",
            updated,
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["project_name"] == "Updated Name"
        assert len(resp.data["products"]) == 1


class TestSmetaDelete:
    """Tests for DELETE /api/smetalar/{id}/."""

    def test_delete(
        self,
        auth_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """Delete removes smeta."""
        auth_client.post(
            "/api/smetalar/",
            _smeta_payload(),
            format="json",
        )
        smeta = XarajatlarSmetasi.objects.first()
        resp = auth_client.delete(f"/api/smetalar/{smeta.pk}/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not XarajatlarSmetasi.objects.filter(pk=smeta.pk).exists()
