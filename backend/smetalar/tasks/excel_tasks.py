"""Celery tasks for smetalar app."""

import logging

from config.celery import app

logger = logging.getLogger(__name__)


@app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=10,
    time_limit=120,
)
def generate_excel_task(self, smeta_id: int) -> str:  # type: ignore[override]
    """Generate Excel file for a smeta asynchronously.

    Args:
        self: Celery task instance.
        smeta_id: Primary key of the XarajatlarSmetasi.

    Returns:
        URL path of the generated Excel file.

    Raises:
        Exception: Re-raised for Celery retry mechanism.
    """
    from smetalar.models import XarajatlarSmetasi
    from smetalar.services.excel_service import generate_smeta_excel

    try:
        smeta = XarajatlarSmetasi.objects.get(pk=smeta_id)
        return generate_smeta_excel(smeta)
    except XarajatlarSmetasi.DoesNotExist:
        logger.error("Smeta topilmadi: id=%d", smeta_id)
        return ""
    except Exception as exc:
        logger.error(
            "Excel yaratishda xatolik: smeta_id=%d",
            smeta_id,
            exc_info=True,
        )
        raise self.retry(exc=exc)
