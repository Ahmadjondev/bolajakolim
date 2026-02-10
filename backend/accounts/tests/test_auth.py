"""Tests for accounts authentication API."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture()
def api_client() -> APIClient:
    """Return a DRF test client."""
    return APIClient()


@pytest.fixture()
def user() -> User:  # type: ignore[valid-type]
    """Create and return a test user."""
    return User.objects.create_user(
        email="test@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
    )


class TestRegister:
    """Tests for POST /api/auth/register/."""

    URL = "/api/auth/register/"

    def test_register_success(self, api_client: APIClient) -> None:
        """New user is created and tokens are returned."""
        payload = {
            "email": "new@example.com",
            "password": "securepass8",
            "first_name": "New",
            "last_name": "User",
        }
        resp = api_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert "access" in resp.data
        assert "refresh" in resp.data
        assert resp.data["user"]["email"] == "new@example.com"
        assert User.objects.filter(email="new@example.com").exists()

    def test_register_duplicate_email(
        self,
        api_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """Duplicate email returns 400."""
        payload = {
            "email": "test@example.com",
            "password": "securepass8",
        }
        resp = api_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_short_password(
        self,
        api_client: APIClient,
    ) -> None:
        """Password < 8 chars returns 400."""
        payload = {"email": "x@x.com", "password": "short"}
        resp = api_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


class TestLogin:
    """Tests for POST /api/auth/login/."""

    URL = "/api/auth/login/"

    def test_login_success(
        self,
        api_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """Valid credentials return tokens."""
        payload = {
            "email": "test@example.com",
            "password": "testpass123",
        }
        resp = api_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data
        assert resp.data["user"]["email"] == "test@example.com"

    def test_login_invalid_password(
        self,
        api_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """Wrong password returns 401."""
        payload = {
            "email": "test@example.com",
            "password": "wrongpass",
        }
        resp = api_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(
        self,
        api_client: APIClient,
    ) -> None:
        """Non-existent email returns 401."""
        payload = {
            "email": "nobody@example.com",
            "password": "doesntmatter",
        }
        resp = api_client.post(self.URL, payload, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestMe:
    """Tests for GET /api/auth/me/."""

    URL = "/api/auth/me/"

    def test_me_authenticated(
        self,
        api_client: APIClient,
        user: User,  # type: ignore[valid-type]
    ) -> None:
        """Authenticated user gets their profile."""
        api_client.force_authenticate(user=user)
        resp = api_client.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["email"] == "test@example.com"

    def test_me_unauthenticated(
        self,
        api_client: APIClient,
    ) -> None:
        """Unauthenticated request returns 401."""
        resp = api_client.get(self.URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
