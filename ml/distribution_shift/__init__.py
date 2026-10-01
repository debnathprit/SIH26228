"""Distribution Shift & Anomaly Detection for Computer Vision Assurance (PS ID 26228).

Evaluates operational query images against reference baselines across multiple physical
and statistical dimensions (illumination, contrast, color spectrum, spatial sharpness).
"""

from ml.distribution_shift.detector import (
    DistributionShiftEvaluator,
    DistributionShiftReport,
    SCIENTIFIC_LIMITATION,
    ShiftDimension,
    evaluate_distribution_shift,
)

__all__ = [
    "DistributionShiftEvaluator",
    "DistributionShiftReport",
    "ShiftDimension",
    "SCIENTIFIC_LIMITATION",
    "evaluate_distribution_shift",
]
