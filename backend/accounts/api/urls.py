"""URL patterns for accounts API."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.api.views import (
    GoogleLoginView,
    LoginView,
    MeView,
    RegisterView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google/", GoogleLoginView.as_view(), name="google-login"),
    path("me/", MeView.as_view(), name="me"),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),
]
