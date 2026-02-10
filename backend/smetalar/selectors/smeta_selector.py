"""Selectors (read-only queries) for smetalar app."""

from django.db.models import QuerySet

from smetalar.models import XarajatlarSmetasi


def get_user_smetalar(
    user_id: int,
    status: str | None = None,
) -> QuerySet[XarajatlarSmetasi]:
    """Return smetalar queryset for a given user.

    Args:
        user_id: The owner's primary key.
        status: Optional filter by status ('draft' or 'completed').

    Returns:
        Filtered and ordered queryset.
    """
    qs = XarajatlarSmetasi.objects.filter(user_id=user_id)
    if status:
        qs = qs.filter(status=status)
    return qs.order_by("-updated_at")


def get_smeta_detail(
    smeta_id: int,
    user_id: int,
) -> XarajatlarSmetasi | None:
    """Get a single smeta with prefetched relations.

    Args:
        smeta_id: The smeta primary key.
        user_id: The owner's primary key.

    Returns:
        XarajatlarSmetasi instance or None.
    """
    return (
        XarajatlarSmetasi.objects.filter(
            pk=smeta_id,
            user_id=user_id,
        )
        .prefetch_related(
            "employees",
            "inventory_items",
            "raw_materials",
            "other_expenses",
            "products",
            "davr_xarajatlari",
            "sotish_rejasi_yillari__products",
        )
        .first()
    )
