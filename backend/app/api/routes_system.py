"""System and health endpoints for the Trusted Computer Vision Assurance API."""

from fastapi import APIRouter
from backend.app.models.schemas import (
    APIResponseEnvelope,
    HealthData,
    SystemComponents,
    SystemOverviewData,
)

router = APIRouter(tags=["System"])


@router.get(
    "/health",
    response_model=APIResponseEnvelope[HealthData],
    summary="Health check endpoint",
)
def get_health() -> APIResponseEnvelope[HealthData]:
    """Return current API status and version within the standardized envelope."""
    return APIResponseEnvelope(data=HealthData(status="ok", version="1.0.0"))


@router.get(
    "/system/overview",
    response_model=APIResponseEnvelope[SystemOverviewData],
    summary="System overview and components status",
)
def get_system_overview() -> APIResponseEnvelope[SystemOverviewData]:
    """Return overview of implemented assurance components in the repository."""
    return APIResponseEnvelope(
        data=SystemOverviewData(
            project="Trusted Computer Vision Assurance",
            api_version="v1",
            components=SystemComponents(
                dataset_integrity=True,
                model_integrity=True,
                computer_vision_inference=True,
                cryptographic_evidence=True,
                tamper_evident_ledger=True,
                mlflow_tracking=True,
                dvc_dataset_versioning=True,
            ),
        )
    )
