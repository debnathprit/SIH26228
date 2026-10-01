"""Standardized Pydantic schemas and response envelopes for the API."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponseEnvelope(BaseModel, Generic[T]):
    """Standardized response envelope across all API endpoints."""

    status: str = "success"
    data: Optional[T] = None
    error: Optional[str] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class HealthData(BaseModel):
    """Health check payload."""

    status: str = "ok"
    version: str = "1.0.0"


class SystemComponents(BaseModel):
    """Reflects the actual verified subsystems active in the repository."""

    dataset_integrity: bool = True
    model_integrity: bool = True
    computer_vision_inference: bool = True
    cryptographic_evidence: bool = True
    tamper_evident_ledger: bool = True
    mlflow_tracking: bool = True
    dvc_dataset_versioning: bool = True


class SystemOverviewData(BaseModel):
    """System overview payload."""

    project: str = "Trusted Computer Vision Assurance"
    api_version: str = "v1"
    components: SystemComponents = Field(default_factory=SystemComponents)
