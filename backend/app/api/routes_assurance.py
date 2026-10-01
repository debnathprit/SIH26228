"""Assurance summary routes for Trusted Computer Vision Assurance API."""

from fastapi import APIRouter
from backend.app.models.schemas import APIResponseEnvelope, AssuranceSummaryData
from backend.app.services.assurance_service import get_default_assurance_service

router = APIRouter(tags=["Assurance"])


@router.get(
    "/assurance/summary",
    response_model=APIResponseEnvelope[AssuranceSummaryData],
    summary="Get aggregated executive assurance summary",
)
def get_assurance_summary() -> APIResponseEnvelope[AssuranceSummaryData]:
    """Return consolidated lifecycle assurance evaluation across all 5 capability pillars."""
    service = get_default_assurance_service()
    summary = service.build_assurance_summary()
    return APIResponseEnvelope(data=summary)
