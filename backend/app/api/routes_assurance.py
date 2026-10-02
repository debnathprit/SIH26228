"""Assurance summary and active distribution-shift evaluation routes."""

from pathlib import Path
import tempfile
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, status
from fastapi.responses import JSONResponse
from PIL import Image

from backend.app.models.schemas import (
    APIResponseEnvelope,
    AssuranceSummaryData,
    DistributionShiftEvaluationData,
    ShiftDimensionData,
)
from backend.app.services.assurance_service import get_default_assurance_service

router = APIRouter(tags=["Assurance"])

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
CHUNK_SIZE_BYTES = 64 * 1024  # 64 KB chunk size for streaming
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"}


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


@router.post(
    "/assurance/distribution-shift/evaluate",
    response_model=APIResponseEnvelope[DistributionShiftEvaluationData],
    summary="Evaluate operational query image for distribution shift and anomaly detection",
)
async def evaluate_distribution_shift_endpoint(
    file: Optional[UploadFile] = File(None),
    reference_dataset: Optional[str] = Form(None),
) -> JSONResponse:
    """Evaluate an operational query image against the reference baseline.

    Uploads the image, enforces size/format validations, executes mathematical
    drift detection (Wasserstein-1 / KS / Laplacian variance), generates cryptographic
    evidence, and appends a verified record to the tamper-evident ledger.
    """
    # 1. Validate file presence
    if file is None or not file.filename:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=APIResponseEnvelope(
                status="error",
                data=None,
                error="Missing required image file upload in form data ('file').",
            ).model_dump(),
        )

    # 2. Sanitize filename and validate extension (Path traversal protection)
    raw_filename = file.filename
    sanitized_name = Path(raw_filename).name.strip()
    if not sanitized_name:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=APIResponseEnvelope(
                status="error",
                data=None,
                error="Invalid filename provided.",
            ).model_dump(),
        )

    file_ext = Path(sanitized_name).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=APIResponseEnvelope(
                status="error",
                data=None,
                error=(
                    f"Unsupported image extension '{file_ext}'. "
                    f"Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
                ),
            ).model_dump(),
        )

    # 3. Validate reference dataset path if explicitly provided
    if reference_dataset:
        ref_path = Path(reference_dataset)
        if not ref_path.is_dir():
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=APIResponseEnvelope(
                    status="error",
                    data=None,
                    error=f"Specified reference dataset directory does not exist or is not a directory: '{reference_dataset}'.",
                ).model_dump(),
            )

    # 4. Stream write into a secure temporary file with 10 MB size limit
    tmp_file = tempfile.NamedTemporaryFile(suffix=file_ext, delete=False)
    tmp_path = Path(tmp_file.name)
    total_bytes = 0

    try:
        try:
            while chunk := await file.read(CHUNK_SIZE_BYTES):
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_SIZE_BYTES:
                    tmp_file.close()
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content=APIResponseEnvelope(
                            status="error",
                            data=None,
                            error=(
                                f"Uploaded file exceeds maximum limit of "
                                f"{MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
                            ),
                        ).model_dump(),
                    )
                tmp_file.write(chunk)
            tmp_file.close()
        except Exception as read_err:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=APIResponseEnvelope(
                    status="error",
                    data=None,
                    error=f"Error reading upload stream: {read_err}",
                ).model_dump(),
            )

        # 5. Validate file is not 0 bytes
        if total_bytes == 0:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=APIResponseEnvelope(
                    status="error",
                    data=None,
                    error="Uploaded image file is empty (0 bytes).",
                ).model_dump(),
            )

        # 6. Validate image decodability and dimension bounds
        try:
            with Image.open(tmp_path) as img:
                img.verify()
            with Image.open(tmp_path) as img:
                width, height = img.size
                if width == 0 or height == 0:
                    raise ValueError("Image dimensions cannot be zero.")
                if width > 8192 or height > 8192:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content=APIResponseEnvelope(
                            status="error",
                            data=None,
                            error=f"Image dimensions ({width}x{height}) exceed maximum allowed dimension of 8192x8192.",
                        ).model_dump(),
                    )
        except Exception:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=APIResponseEnvelope(
                    status="error",
                    data=None,
                    error="Uploaded file is corrupt or not a valid readable image.",
                ).model_dump(),
            )

        # 7. Execute active distribution shift evaluation
        try:
            service = get_default_assurance_service()
            report = service.evaluate_active_distribution_shift(
                query_image_path=tmp_path,
                display_filename=sanitized_name,
                reference_dir=reference_dataset,
            )
        except Exception as eval_err:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=APIResponseEnvelope(
                    status="error",
                    data=None,
                    error=f"Distribution shift evaluation failed: {eval_err}",
                ).model_dump(),
            )

        if report.status == "UNAVAILABLE":
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=APIResponseEnvelope(
                    status="error",
                    data=None,
                    error=report.explanation,
                ).model_dump(),
            )

        # 8. Format structured response payload
        dimensions_data = [
            ShiftDimensionData(
                dimension=d.dimension,
                shiftValue=d.shift_value,
                status=d.status,
                note=d.note,
            )
            for d in report.dimensions
        ]

        evaluation_data = DistributionShiftEvaluationData(
            assessmentTimestamp=report.assessment_timestamp,
            referenceDataset=report.reference_dataset,
            referenceFingerprint=report.reference_fingerprint,
            queryTarget=sanitized_name,
            queryHash=report.query_hash or "",
            overallDriftScore=report.overall_drift_score,
            overallSeverity=report.overall_severity,
            overallConfidence=report.overall_confidence,
            classification=report.classification,
            status=report.status,
            dimensions=dimensions_data,
            evidenceHash=report.evidence_hash or "",
            explanation=report.explanation,
            evidenceAvailable=report.evidence_available,
            ledgerRecordIndex=report.ledger_record_index,
            limitations=report.limitations,
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=APIResponseEnvelope(data=evaluation_data).model_dump(),
        )

    finally:
        # 9. Guaranteed cleanup: ephemeral storage only
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass

