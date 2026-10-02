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


class AssurancePillar(BaseModel):
    """Evaluation assessment for an individual lifecycle capability pillar."""

    id: str
    title: str
    status: str  # VERIFIED | REVIEW | TAMPERED | UNAVAILABLE
    severity: str  # low | medium | high | critical
    confidence: float = Field(ge=0.0, le=1.0)
    asset: str
    explanation: str
    evidenceAvailable: bool = False


class AssuranceSummaryData(BaseModel):
    """Aggregated executive assurance summary replacing frontend mock cards."""

    assessmentTimestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    globalDisposition: str  # VERIFIED | REVIEW | TAMPERED | UNAVAILABLE
    globalReason: str
    evidenceCount: int = Field(ge=0)
    unresolvedFlags: int = Field(ge=0)
    pillars: list[AssurancePillar] = Field(default_factory=list)


class ShiftDimensionData(BaseModel):
    """Evaluated metric shift for an individual physical image dimension."""

    dimension: str
    shiftValue: float = Field(ge=0.0)
    status: str  # NORMAL | DRIFT_DETECTED | ANOMALOUS
    note: str


class DistributionShiftEvaluationData(BaseModel):
    """Structured response payload for active distribution shift evaluation."""

    assessmentTimestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    referenceDataset: str
    referenceFingerprint: str
    queryTarget: str
    queryHash: Optional[str] = None
    overallDriftScore: float = Field(ge=0.0, le=1.0)
    overallSeverity: str  # low | medium | high | critical
    overallConfidence: float = Field(ge=0.0, le=1.0)
    classification: str  # IN-DISTRIBUTION | OPERATIONAL DRIFT | OUT-OF-DISTRIBUTION | UNAVAILABLE
    status: str  # VERIFIED | REVIEW | UNAVAILABLE | TAMPERED
    dimensions: list[ShiftDimensionData] = Field(default_factory=list)
    evidenceHash: Optional[str] = None
    explanation: str
    evidenceAvailable: bool = False
    ledgerRecordIndex: Optional[int] = None
    limitations: str


