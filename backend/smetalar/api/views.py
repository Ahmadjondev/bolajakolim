"""API views for smetalar app."""

import logging

from django.db.models import Value
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from smetalar.api.filters import SmetaFilter
from smetalar.api.pagination import SmetaPagination
from smetalar.api.serializers.input import SmetaCreateSerializer
from smetalar.api.serializers.output import (
    SmetaDetailSerializer,
    SmetaListSerializer,
)
from smetalar.selectors.smeta_selector import (
    get_smeta_detail,
    get_user_smetalar,
)
from smetalar.services.smeta_service import create_smeta, update_smeta

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="List smetalar",
        description=(
            "Paginated list of the authenticated user's " "Xarajatlar Smetalari."
        ),
        responses={200: SmetaListSerializer(many=True)},
    ),
    retrieve=extend_schema(
        summary="Smeta detail",
        description="Full detail of a single Xarajatlar Smetasi.",
        responses={200: SmetaDetailSerializer},
    ),
    create=extend_schema(
        summary="Create smeta",
        description=("Create a new Xarajatlar Smetasi with all nested data."),
        request=SmetaCreateSerializer,
        responses={201: SmetaDetailSerializer},
    ),
    update=extend_schema(
        summary="Update smeta",
        description="Full update of an existing smeta.",
        request=SmetaCreateSerializer,
        responses={200: SmetaDetailSerializer},
    ),
    destroy=extend_schema(
        summary="Delete smeta",
        description="Delete a smeta and all its related data.",
        responses={204: None},
    ),
)
class SmetaViewSet(ViewSet):
    """ViewSet for Xarajatlar Smetasi CRUD operations."""

    permission_classes = [IsAuthenticated]
    pagination_class = SmetaPagination

    def list(self, request: Request) -> Response:
        """List smetalar for the authenticated user with pagination.

        Args:
            request: Authenticated DRF Request.

        Returns:
            Paginated list of smetalar.
        """
        status_filter = request.query_params.get("status")
        search = request.query_params.get("search")
        qs = get_user_smetalar(
            user_id=request.user.pk,
            status=status_filter,
        )
        if search:
            qs = qs.filter(project_name__icontains=search)

        # Annotate grand_total for list serializer
        qs = qs.annotate(
            _dummy=Value(0),
        )

        paginator = SmetaPagination()
        page = paginator.paginate_queryset(qs, request)

        # Compute grand_total per smeta in list
        result = []
        for smeta in page:
            data = SmetaListSerializer(smeta).data
            from smetalar.services.smeta_service import (
                calculate_grand_total,
            )

            data["grand_total"] = calculate_grand_total(smeta)
            result.append(data)

        return paginator.get_paginated_response(result)

    def retrieve(self, request: Request, pk: str = None) -> Response:
        """Get full detail of a single smeta.

        Args:
            request: Authenticated DRF Request.
            pk: Smeta primary key.

        Returns:
            Full smeta data with nested items.
        """
        smeta = get_smeta_detail(
            smeta_id=int(pk),  # type: ignore[arg-type]
            user_id=request.user.pk,
        )
        if smeta is None:
            return Response(
                {"detail": "Smeta topilmadi."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = SmetaDetailSerializer(
            smeta,
            context={"request": request},
        )
        return Response(serializer.data)

    def create(self, request: Request) -> Response:
        """Create a new smeta.

        Args:
            request: Authenticated DRF Request with smeta data.

        Returns:
            Created smeta detail.
        """
        serializer = SmetaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        smeta = create_smeta(
            user=request.user,
            data=serializer.validated_data,
        )

        detail = get_smeta_detail(
            smeta_id=smeta.pk,
            user_id=request.user.pk,
        )
        return Response(
            SmetaDetailSerializer(
                detail,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request: Request, pk: str = None) -> Response:
        """Update an existing smeta.

        Args:
            request: Authenticated DRF Request with smeta data.
            pk: Smeta primary key.

        Returns:
            Updated smeta detail.
        """
        smeta = get_smeta_detail(
            smeta_id=int(pk),  # type: ignore[arg-type]
            user_id=request.user.pk,
        )
        if smeta is None:
            return Response(
                {"detail": "Smeta topilmadi."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SmetaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        smeta = update_smeta(
            smeta=smeta,
            data=serializer.validated_data,
        )

        detail = get_smeta_detail(
            smeta_id=smeta.pk,
            user_id=request.user.pk,
        )
        return Response(
            SmetaDetailSerializer(
                detail,
                context={"request": request},
            ).data,
        )

    def partial_update(self, request: Request, pk: str = None) -> Response:
        """Partial update an existing smeta (PATCH).

        Only updates fields that are present in the request body.

        Args:
            request: Authenticated DRF Request with partial smeta data.
            pk: Smeta primary key.

        Returns:
            Updated smeta detail.
        """
        smeta = get_smeta_detail(
            smeta_id=int(pk),  # type: ignore[arg-type]
            user_id=request.user.pk,
        )
        if smeta is None:
            return Response(
                {"detail": "Smeta topilmadi."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SmetaCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        smeta = update_smeta(
            smeta=smeta,
            data=serializer.validated_data,
        )

        detail = get_smeta_detail(
            smeta_id=smeta.pk,
            user_id=request.user.pk,
        )
        return Response(
            SmetaDetailSerializer(
                detail,
                context={"request": request},
            ).data,
        )

    def destroy(self, request: Request, pk: str = None) -> Response:
        """Delete a smeta.

        Args:
            request: Authenticated DRF Request.
            pk: Smeta primary key.

        Returns:
            204 No Content.
        """
        smeta = get_smeta_detail(
            smeta_id=int(pk),  # type: ignore[arg-type]
            user_id=request.user.pk,
        )
        if smeta is None:
            return Response(
                {"detail": "Smeta topilmadi."},
                status=status.HTTP_404_NOT_FOUND,
            )
        smeta.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
