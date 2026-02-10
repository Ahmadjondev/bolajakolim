"""FilterSet for smetalar API."""

import django_filters

from smetalar.models import XarajatlarSmetasi


class SmetaFilter(django_filters.FilterSet):
    """Filter for Xarajatlar Smetasi list endpoint.

    Supports filtering by status and search by project_name.
    """

    status = django_filters.ChoiceFilter(
        choices=[("draft", "Qoralama"), ("completed", "Yakunlangan")],
    )

    class Meta:
        model = XarajatlarSmetasi
        fields = ["status"]
