"""Distribution Shift and Out-of-Distribution Anomaly Evaluation Engine (PS ID 26228).

Evaluates operational query images against reference baselines across multiple physical
and statistical dimensions:
- Luminance / Illumination distribution (Wasserstein-1 distance & Kolmogorov-Smirnov test)
- Contrast / Dynamic range deviation (Standard deviation of pixel intensities)
- Color / Chrominance distribution (HSV Hue & Saturation Wasserstein-1 distance)
- Spatial Sharpness / Blur (Laplacian variance with exponential normalization)

Scientific Limitation Notice:
The current reference baseline consists of 3 sample reference images
(data/sample/sample_01.png, sample_02.png, sample_03.png). While sufficient
for deterministic mathematical validation, reproducible unit testing, and
pipeline demonstration, it is not statistically representative of a full
operational multi-contributor computer vision deployment. In operational
production, the reference baseline should contain a statistically representative
population (hundreds/thousands of operational frames) version-controlled via DVC.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
import sys
from typing import Any, Union

import cv2
import numpy as np
from scipy.stats import ks_2samp, wasserstein_distance

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.utils.crypto_utils import canonicalize_json, sha256_bytes, sha256_file, sha256_json, verify_hash
from blockchain.ledger.hash_chain import HashChainLedger

SUPPORTED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".webp", ".tiff", ".tif"}

SCIENTIFIC_LIMITATION = (
    "The current reference baseline consists of 3 sample reference images "
    "(data/sample/sample_01.png, sample_02.png, sample_03.png). While sufficient "
    "for deterministic mathematical validation, reproducible unit testing, and "
    "pipeline demonstration, it is not statistically representative of a full "
    "operational multi-contributor computer vision deployment. In operational "
    "production, the reference baseline should contain a statistically representative "
    "population (hundreds/thousands of operational frames) version-controlled via DVC."
)


@dataclass
class ShiftDimension:
    """Evaluated metric shift for an individual physical image dimension."""

    dimension: str
    shift_value: float
    status: str  # NORMAL | DRIFT_DETECTED | ANOMALOUS
    note: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "dimension": self.dimension,
            "shift_value": round(float(self.shift_value), 4),
            "status": self.status,
            "note": self.note,
        }


@dataclass
class DistributionShiftReport:
    """Comprehensive evaluation report for distribution shift and anomaly detection."""

    assessment_timestamp: str
    reference_dataset: str
    reference_fingerprint: str
    query_target: str
    query_hash: str | None
    overall_drift_score: float
    overall_severity: str  # low | medium | high
    overall_confidence: float
    classification: str  # IN-DISTRIBUTION | OPERATIONAL DRIFT | OUT-OF-DISTRIBUTION | UNAVAILABLE
    status: str  # VERIFIED | REVIEW | UNAVAILABLE | TAMPERED
    dimensions: list[ShiftDimension]
    evidence_hash: str | None
    explanation: str
    evidence_available: bool
    limitations: str = SCIENTIFIC_LIMITATION

    def to_dict(self) -> dict[str, Any]:
        return {
            "assessment_timestamp": self.assessment_timestamp,
            "reference_dataset": self.reference_dataset,
            "reference_fingerprint": self.reference_fingerprint,
            "query_target": self.query_target,
            "query_hash": self.query_hash,
            "overall_drift_score": round(float(self.overall_drift_score), 4),
            "overall_severity": self.overall_severity,
            "overall_confidence": round(float(self.overall_confidence), 4),
            "classification": self.classification,
            "status": self.status,
            "dimensions": [d.to_dict() for d in self.dimensions],
            "evidence_hash": self.evidence_hash,
            "explanation": self.explanation,
            "evidence_available": self.evidence_available,
            "limitations": self.limitations,
        }


def extract_image_features(image_path_or_array: Union[str, Path, np.ndarray]) -> dict[str, Any] | None:
    """Extract standardized numerical features from a single image.

    Features extracted:
    - Grayscale pixel array (1D uint8)
    - Normalized contrast (std / 127.5)
    - HSV Hue pixel array (1D uint8, [0, 180))
    - HSV Saturation pixel array (1D uint8, [0, 256))
    - Spatial sharpness (exponentially scaled Laplacian variance)
    - Raw Laplacian variance
    """
    if isinstance(image_path_or_array, (str, Path)):
        p = Path(image_path_or_array)
        if not p.is_file():
            return None
        img = cv2.imread(str(p), cv2.IMREAD_COLOR)
    elif isinstance(image_path_or_array, np.ndarray):
        img = image_path_or_array
    else:
        return None

    if img is None or img.size == 0:
        return None

    # Ensure 3-channel color image
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    # 1. Grayscale & Luminance
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    contrast = float(np.std(gray)) / 127.5

    # 2. HSV & Color Spectrum
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hue = hsv[:, :, 0].flatten()
    sat = hsv[:, :, 1].flatten()

    # 3. Spatial Sharpness (Laplacian variance)
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    lap_var = float(lap.var())
    sharp = 1.0 - float(np.exp(-lap_var / 500.0))

    return {
        "gray": gray.flatten(),
        "contrast": contrast,
        "hue": hue,
        "sat": sat,
        "sharp": sharp,
        "lap_var": lap_var,
    }


class DistributionShiftEvaluator:
    """Evaluates distribution drift between query imagery and reference baselines."""

    def __init__(self, reference_dir: Union[str, Path] | None = None) -> None:
        self.reference_dir = Path(reference_dir) if reference_dir else PROJECT_ROOT / "data" / "sample"
        self._reference_fingerprint: str | None = None
        self._reference_features: list[dict[str, Any]] | None = None

    def get_reference_files(self) -> list[Path]:
        """Return sorted list of supported reference image files."""
        if not self.reference_dir.is_dir():
            return []
        files = [
            f for f in sorted(self.reference_dir.iterdir())
            if f.is_file() and f.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
        ]
        return files

    def get_reference_fingerprint(self) -> str:
        """Compute deterministic SHA-256 fingerprint over sorted reference file hashes."""
        if self._reference_fingerprint is not None:
            return self._reference_fingerprint

        files = self.get_reference_files()
        if not files:
            return "UNAVAILABLE"

        file_hashes = [sha256_file(f) for f in files]
        combined = ":".join(file_hashes)
        self._reference_fingerprint = sha256_bytes(combined.encode("utf-8"))
        return self._reference_fingerprint

    def load_reference_features(self) -> list[dict[str, Any]]:
        """Load and cache extracted features for the reference dataset."""
        if self._reference_features is not None:
            return self._reference_features

        files = self.get_reference_files()
        features: list[dict[str, Any]] = []
        for f in files:
            feat = extract_image_features(f)
            if feat is not None:
                features.append(feat)

        self._reference_features = features
        return self._reference_features

    def evaluate(
        self,
        query_target: Union[str, Path, None] = None,
        ledger: HashChainLedger | None = None,
        timestamp: str | None = None,
    ) -> DistributionShiftReport:
        """Evaluate a query image or image directory against the reference baseline.

        Returns an explicit UNAVAILABLE report if query_target is missing, invalid,
        or unreadable, without fabricating artificial drift scores.
        """
        now_iso = timestamp or datetime.now(timezone.utc).isoformat()
        ref_fingerprint = self.get_reference_fingerprint()

        # 1. Guard: Missing query target
        if query_target is None or str(query_target).strip() == "":
            return DistributionShiftReport(
                assessment_timestamp=now_iso,
                reference_dataset=str(self.reference_dir),
                reference_fingerprint=ref_fingerprint,
                query_target="None",
                query_hash=None,
                overall_drift_score=0.0,
                overall_severity="low",
                overall_confidence=0.0,
                classification="UNAVAILABLE",
                status="UNAVAILABLE",
                dimensions=[],
                evidence_hash=None,
                explanation="No operational query target provided for distribution shift evaluation.",
                evidence_available=False,
            )

        # 2. Guard: Missing or unreadable reference baseline
        ref_features = self.load_reference_features()
        if not ref_features:
            return DistributionShiftReport(
                assessment_timestamp=now_iso,
                reference_dataset=str(self.reference_dir),
                reference_fingerprint=ref_fingerprint,
                query_target=str(query_target),
                query_hash=None,
                overall_drift_score=0.0,
                overall_severity="low",
                overall_confidence=0.0,
                classification="UNAVAILABLE",
                status="UNAVAILABLE",
                dimensions=[],
                evidence_hash=None,
                explanation="Reference baseline dataset unavailable or contains no valid images.",
                evidence_available=False,
            )

        # 3. Resolve query target path
        query_path = Path(query_target)
        if not query_path.exists():
            return DistributionShiftReport(
                assessment_timestamp=now_iso,
                reference_dataset=str(self.reference_dir),
                reference_fingerprint=ref_fingerprint,
                query_target=str(query_target),
                query_hash=None,
                overall_drift_score=0.0,
                overall_severity="low",
                overall_confidence=0.0,
                classification="UNAVAILABLE",
                status="UNAVAILABLE",
                dimensions=[],
                evidence_hash=None,
                explanation=f"Query target path does not exist: '{query_target}'.",
                evidence_available=False,
            )

        # 4. Extract query features
        query_features: list[dict[str, Any]] = []
        query_hashes: list[str] = []

        if query_path.is_file():
            if query_path.suffix.lower() not in SUPPORTED_IMAGE_EXTENSIONS:
                return DistributionShiftReport(
                    assessment_timestamp=now_iso,
                    reference_dataset=str(self.reference_dir),
                    reference_fingerprint=ref_fingerprint,
                    query_target=str(query_target),
                    query_hash=None,
                    overall_drift_score=0.0,
                    overall_severity="low",
                    overall_confidence=0.0,
                    classification="UNAVAILABLE",
                    status="UNAVAILABLE",
                    dimensions=[],
                    evidence_hash=None,
                    explanation=f"Query file '{query_path.name}' has unsupported extension.",
                    evidence_available=False,
                )
            feat = extract_image_features(query_path)
            if feat is None:
                return DistributionShiftReport(
                    assessment_timestamp=now_iso,
                    reference_dataset=str(self.reference_dir),
                    reference_fingerprint=ref_fingerprint,
                    query_target=str(query_target),
                    query_hash=None,
                    overall_drift_score=0.0,
                    overall_severity="low",
                    overall_confidence=0.0,
                    classification="UNAVAILABLE",
                    status="UNAVAILABLE",
                    dimensions=[],
                    evidence_hash=None,
                    explanation=f"Failed to decode image from query file: '{query_path.name}'.",
                    evidence_available=False,
                )
            query_features.append(feat)
            query_hash = sha256_file(query_path)
        else:
            # Query is a directory
            img_files = [
                f for f in sorted(query_path.iterdir())
                if f.is_file() and f.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
            ]
            if not img_files:
                return DistributionShiftReport(
                    assessment_timestamp=now_iso,
                    reference_dataset=str(self.reference_dir),
                    reference_fingerprint=ref_fingerprint,
                    query_target=str(query_target),
                    query_hash=None,
                    overall_drift_score=0.0,
                    overall_severity="low",
                    overall_confidence=0.0,
                    classification="UNAVAILABLE",
                    status="UNAVAILABLE",
                    dimensions=[],
                    evidence_hash=None,
                    explanation=f"Query directory contains no supported images: '{query_target}'.",
                    evidence_available=False,
                )
            for img_file in img_files:
                feat = extract_image_features(img_file)
                if feat is not None:
                    query_features.append(feat)
                    query_hashes.append(sha256_file(img_file))

            if not query_features:
                return DistributionShiftReport(
                    assessment_timestamp=now_iso,
                    reference_dataset=str(self.reference_dir),
                    reference_fingerprint=ref_fingerprint,
                    query_target=str(query_target),
                    query_hash=None,
                    overall_drift_score=0.0,
                    overall_severity="low",
                    overall_confidence=0.0,
                    classification="UNAVAILABLE",
                    status="UNAVAILABLE",
                    dimensions=[],
                    evidence_hash=None,
                    explanation=f"No valid readable images could be decoded from query directory: '{query_target}'.",
                    evidence_available=False,
                )
            query_hash = sha256_bytes(":".join(query_hashes).encode("utf-8"))

        # 5. Aggregate feature distributions
        ref_gray = np.concatenate([f["gray"] for f in ref_features])
        query_gray = np.concatenate([f["gray"] for f in query_features])

        ref_contrast = float(np.mean([f["contrast"] for f in ref_features]))
        query_contrast = float(np.mean([f["contrast"] for f in query_features]))

        ref_hue = np.concatenate([f["hue"] for f in ref_features])
        query_hue = np.concatenate([f["hue"] for f in query_features])

        ref_sat = np.concatenate([f["sat"] for f in ref_features])
        query_sat = np.concatenate([f["sat"] for f in query_features])

        ref_sharp = float(np.mean([f["sharp"] for f in ref_features]))
        query_sharp = float(np.mean([f["sharp"] for f in query_features]))

        # 6. Compute multi-dimensional metrics
        # Dimensional check 1: Luminance (Wasserstein-1 / 255.0)
        d_lum = float(wasserstein_distance(query_gray, ref_gray)) / 255.0
        ks_lum = float(ks_2samp(query_gray, ref_gray).statistic)

        # Dimensional check 2: Contrast (|query - ref|)
        d_contrast = float(abs(query_contrast - ref_contrast))

        # Dimensional check 3: Color Spectrum (HSV Hue + Saturation Wasserstein-1)
        d_hue = float(wasserstein_distance(query_hue, ref_hue)) / 180.0
        d_sat = float(wasserstein_distance(query_sat, ref_sat)) / 255.0
        d_color = 0.5 * d_hue + 0.5 * d_sat

        # Dimensional check 4: Spatial Sharpness
        d_sharp = float(abs(query_sharp - ref_sharp))

        # Dimensional status helper
        def _get_dim_status(val: float) -> tuple[str, str]:
            if val <= 0.15:
                return "NORMAL", "Within nominal operational baseline"
            elif val <= 0.40:
                return "DRIFT_DETECTED", f"Moderate drift detected (metric: {val:.4f})"
            else:
                return "ANOMALOUS", f"Severe anomaly detected (metric: {val:.4f})"

        st_lum, note_lum = _get_dim_status(d_lum)
        st_con, note_con = _get_dim_status(d_contrast)
        st_col, note_col = _get_dim_status(d_color)
        st_shp, note_shp = _get_dim_status(d_sharp)

        dimensions = [
            ShiftDimension(
                dimension="Illumination",
                shift_value=d_lum,
                status=st_lum,
                note=f"{note_lum} (KS-stat: {ks_lum:.4f})",
            ),
            ShiftDimension(
                dimension="Contrast",
                shift_value=d_contrast,
                status=st_con,
                note=note_con,
            ),
            ShiftDimension(
                dimension="Color Spectrum",
                shift_value=d_color,
                status=st_col,
                note=f"{note_col} (Hue-W1: {d_hue:.4f}, Sat-W1: {d_sat:.4f})",
            ),
            ShiftDimension(
                dimension="Spatial Sharpness",
                shift_value=d_sharp,
                status=st_shp,
                note=note_shp,
            ),
        ]

        # 7. Aggregate drift score in [0.0, 1.0]
        # Weights: 0.30 Lum + 0.20 Contrast + 0.25 Color + 0.25 Sharpness = 1.00
        raw_drift = 0.30 * d_lum + 0.20 * d_contrast + 0.25 * d_color + 0.25 * d_sharp
        overall_drift_score = round(float(np.clip(raw_drift, 0.0, 1.0)), 4)

        # 8. Classification and status assignment
        # Thresholds:
        # <= 0.15: IN-DISTRIBUTION -> VERIFIED
        # > 0.15 and <= 0.40: OPERATIONAL DRIFT -> REVIEW
        # > 0.40: OUT-OF-DISTRIBUTION -> REVIEW (high severity)
        if overall_drift_score <= 0.15:
            classification = "IN-DISTRIBUTION"
            status = "VERIFIED"
            overall_severity = "low"
            explanation = (
                f"Query samples in-distribution relative to baseline reference. "
                f"Aggregate drift: {overall_drift_score:.4f} <= 0.15."
            )
        elif overall_drift_score <= 0.40:
            classification = "OPERATIONAL DRIFT"
            status = "REVIEW"
            overall_severity = "medium"
            explanation = (
                f"Operational distribution drift detected (drift score: {overall_drift_score:.4f}). "
                "Moderate sensor or environmental variance flagged for review."
            )
        else:
            classification = "OUT-OF-DISTRIBUTION"
            status = "REVIEW"
            overall_severity = "high"
            explanation = (
                f"Out-of-distribution anomaly detected (drift score: {overall_drift_score:.4f} > 0.40). "
                "Significant environmental or sensor shift requires analyst inspection."
            )

        overall_confidence = round(float(max(0.50, min(0.99, 1.0 - overall_drift_score))), 4)

        # 9. Cryptographic evidence generation
        evidence_payload: dict[str, Any] = {
            "type": "DISTRIBUTION_SHIFT_EVALUATION",
            "assessment_timestamp": now_iso,
            "classification": classification,
            "dimensions": [d.to_dict() for d in dimensions],
            "overall_drift_score": overall_drift_score,
            "overall_severity": overall_severity,
            "query_hash": query_hash,
            "query_target": str(query_target),
            "reference_fingerprint": ref_fingerprint,
            "status": status,
        }
        evidence_hash = sha256_json(evidence_payload)

        # 10. Ledger append & verification (if ledger provided)
        if ledger is not None:
            ledger_entry = dict(evidence_payload)
            ledger_entry["evidence_hash"] = evidence_hash
            ledger.append_record(payload=ledger_entry, timestamp=now_iso)
            is_valid, reason = ledger.verify_chain()
            if not is_valid:
                status = "TAMPERED"
                overall_severity = "critical"
                explanation = f"Ledger integrity verification failed after shift recording: {reason}"

        return DistributionShiftReport(
            assessment_timestamp=now_iso,
            reference_dataset=str(self.reference_dir),
            reference_fingerprint=ref_fingerprint,
            query_target=str(query_target),
            query_hash=query_hash,
            overall_drift_score=overall_drift_score,
            overall_severity=overall_severity,
            overall_confidence=overall_confidence,
            classification=classification,
            status=status,
            dimensions=dimensions,
            evidence_hash=evidence_hash,
            explanation=explanation,
            evidence_available=True,
            limitations=SCIENTIFIC_LIMITATION,
        )


def evaluate_distribution_shift(
    query_target: Union[str, Path, None] = None,
    reference_dir: Union[str, Path, None] = None,
    ledger: HashChainLedger | None = None,
) -> DistributionShiftReport:
    """Convenience helper to evaluate distribution shift."""
    evaluator = DistributionShiftEvaluator(reference_dir=reference_dir)
    return evaluator.evaluate(query_target=query_target, ledger=ledger)
