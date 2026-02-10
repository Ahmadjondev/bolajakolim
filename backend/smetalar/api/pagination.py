"""Pagination classes for smetalar API."""

from rest_framework.pagination import PageNumberPagination


class SmetaPagination(PageNumberPagination):
    """Pagination for the smeta list endpoint.

    Defaults to 10 items per page, max 50.
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50
