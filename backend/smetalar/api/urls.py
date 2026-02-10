"""URL patterns for smetalar API."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from smetalar.api.views import SmetaViewSet

app_name = "smetalar"

router = DefaultRouter()
router.register("smetalar", SmetaViewSet, basename="smeta")

urlpatterns = [
    path("", include(router.urls)),
]
