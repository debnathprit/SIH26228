"""Unit and Integration Tests for Distribution Shift & Anomaly Evaluation (PS ID 26228).

Verifies:
1. Reference dataset against itself yields IN-DISTRIBUTION and VERIFIED status.
2. Individual reference samples are classified as IN-DISTRIBUTION.
3. Deterministic repeated evaluations yield identical metrics and hashes.
4. Spatial sharpness drift is detected when images are strongly blurred.
5. Luminance and contrast drift are detected under heavy brightness/contrast shifts.
6. Color spectrum drift is detected under channel manipulation.
7. Missing query inputs explicitly return UNAVAILABLE without fabricating scores.
8. Invalid, missing, or non-image query paths safely yield UNAVAILABLE.
9. Cryptographic evidence hashes are deterministically generated and verified.
10. Active evaluations append records to the sequential HashChainLedger and verify the chain.
11. Tampered evidence payloads fail cryptographic verification.
12. Integration with AssuranceService preserves passive backward-compatibility and enables active evaluation.
13. Scientific limitations are prominently disclosed.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import tempfile
import unittest

import cv2
import numpy as np

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.services.assurance_service import AssuranceService
from backend.app.utils.crypto_utils import canonicalize_json, sha256_file, sha256_json, verify_hash
from blockchain.ledger.hash_chain import HashChainLedger
from ml.distribution_shift.detector import (
    DistributionShiftEvaluator,
    SCIENTIFIC_LIMITATION,
    ShiftDimension,
    extract_image_features,
)


class TestDistributionShift(unittest.TestCase):
    """Test suite for the distribution shift detection engine and assurance integration."""

    def setUp(self) -> None:
        self.evaluator = DistributionShiftEvaluator()
        self.reference_dir = PROJECT_ROOT / "data" / "sample"
        self.sample_01 = self.reference_dir / "sample_01.png"
        self.sample_02 = self.reference_dir / "sample_02.png"
        self.sample_03 = self.reference_dir / "sample_03.png"

    def test_reference_fingerprint_deterministic(self) -> None:
        """Verify the reference fingerprint is deterministic and reproducible."""
        fp1 = self.evaluator.get_reference_fingerprint()
        fp2 = self.evaluator.get_reference_fingerprint()
        self.assertEqual(fp1, fp2)
        self.assertEqual(len(fp1), 64)
        self.assertEqual(fp1, "28cd4f66086fface0c84802265842b08d4bfe8622a3a8fb24a70d65d322d8b68")

    def test_reference_dataset_against_itself(self) -> None:
        """Requirement 1: Reference images against themselves -> IN-DISTRIBUTION / VERIFIED."""
        report = self.evaluator.evaluate(query_target=self.reference_dir)
        self.assertEqual(report.status, "VERIFIED")
        self.assertEqual(report.classification, "IN-DISTRIBUTION")
        self.assertEqual(report.overall_severity, "low")
        self.assertEqual(report.overall_drift_score, 0.0)
        self.assertTrue(report.evidence_available)
        self.assertIsNotNone(report.evidence_hash)

        # All 4 dimensions should be zero drift and NORMAL status
        for dim in report.dimensions:
            self.assertEqual(dim.shift_value, 0.0)
            self.assertEqual(dim.status, "NORMAL")

    def test_reference_individual_samples_in_distribution(self) -> None:
        """Verify individual reference samples classify as IN-DISTRIBUTION."""
        for sample_path in [self.sample_01, self.sample_02, self.sample_03]:
            report = self.evaluator.evaluate(query_target=sample_path)
            self.assertEqual(report.status, "VERIFIED", f"Failed for {sample_path.name}")
            self.assertEqual(report.classification, "IN-DISTRIBUTION")
            self.assertLessEqual(report.overall_drift_score, 0.15)
            self.assertEqual(report.overall_severity, "low")
            self.assertTrue(report.evidence_available)

    def test_deterministic_repeated_evaluation(self) -> None:
        """Requirement 2: Deterministic repeated evaluation yields identical metrics and results."""
        fixed_timestamp = "2026-10-02T01:00:00Z"
        rep1 = self.evaluator.evaluate(self.sample_01, timestamp=fixed_timestamp)
        rep2 = self.evaluator.evaluate(self.sample_01, timestamp=fixed_timestamp)

        self.assertEqual(rep1.overall_drift_score, rep2.overall_drift_score)
        self.assertEqual(rep1.classification, rep2.classification)
        self.assertEqual(rep1.evidence_hash, rep2.evidence_hash)
        self.assertEqual(rep1.to_dict(), rep2.to_dict())

    def test_strong_blur_sharpness_drift(self) -> None:
        """Requirement 3: Strong blur yields detectable sharpness drift."""
        # Create a sharp high-frequency patterned image
        pattern = np.zeros((64, 64, 3), dtype=np.uint8)
        pattern[::4, :] = [255, 255, 255]
        pattern[:, ::4] = [255, 255, 255]

        # Blur the pattern strongly
        blurred = cv2.GaussianBlur(pattern, (21, 21), 10.0)

        with tempfile.TemporaryDirectory() as tmpdir:
            sharp_path = Path(tmpdir) / "sharp.png"
            blur_path = Path(tmpdir) / "blur.png"
            cv2.imwrite(str(sharp_path), pattern)
            cv2.imwrite(str(blur_path), blurred)

            # Evaluate with custom reference directory containing the sharp pattern
            evaluator_custom = DistributionShiftEvaluator(reference_dir=tmpdir)
            report = evaluator_custom.evaluate(query_target=blur_path)

            sharpness_dim = next(d for d in report.dimensions if d.dimension == "Spatial Sharpness")
            self.assertGreater(sharpness_dim.shift_value, 0.20)
            self.assertIn(sharpness_dim.status, ("DRIFT_DETECTED", "ANOMALOUS"))

    def test_strong_brightness_contrast_modification(self) -> None:
        """Requirement 4: Strong brightness/contrast modification yields detectable drift."""
        img = cv2.imread(str(self.sample_01))
        # Heavily darken image
        darkened = np.clip(img.astype(np.int32) - 100, 0, 255).astype(np.uint8)

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            temp_path = Path(f.name)

        try:
            cv2.imwrite(str(temp_path), darkened)
            report = self.evaluator.evaluate(query_target=temp_path)

            lum_dim = next(d for d in report.dimensions if d.dimension == "Illumination")
            self.assertGreater(lum_dim.shift_value, 0.15)
            self.assertGreater(report.overall_drift_score, 0.15)
            self.assertIn(report.classification, ("OPERATIONAL DRIFT", "OUT-OF-DISTRIBUTION"))
            self.assertEqual(report.status, "REVIEW")
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def test_color_channel_modification(self) -> None:
        """Requirement 5: Color-channel modification yields detectable color drift."""
        img = cv2.imread(str(self.sample_01))
        # Modify channels: invert colors
        inverted = 255 - img

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            temp_path = Path(f.name)

        try:
            cv2.imwrite(str(temp_path), inverted)
            report = self.evaluator.evaluate(query_target=temp_path)

            color_dim = next(d for d in report.dimensions if d.dimension == "Color Spectrum")
            self.assertGreater(color_dim.shift_value, 0.15)
            self.assertIn(color_dim.status, ("DRIFT_DETECTED", "ANOMALOUS"))
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def test_missing_query_returns_unavailable(self) -> None:
        """Requirement 6: Missing query input explicitly returns UNAVAILABLE without fabricating results."""
        for missing_input in [None, "", "   "]:
            report = self.evaluator.evaluate(query_target=missing_input)
            self.assertEqual(report.status, "UNAVAILABLE")
            self.assertEqual(report.classification, "UNAVAILABLE")
            self.assertEqual(report.overall_severity, "low")
            self.assertEqual(report.overall_confidence, 0.0)
            self.assertEqual(report.overall_drift_score, 0.0)
            self.assertFalse(report.evidence_available)
            self.assertIsNone(report.evidence_hash)

    def test_invalid_query_safe_failure(self) -> None:
        """Requirement 7: Invalid or unreadable query returns safe UNAVAILABLE failure."""
        # Non-existent path
        rep_nonexistent = self.evaluator.evaluate("data/sample/does_not_exist_12345.png")
        self.assertEqual(rep_nonexistent.status, "UNAVAILABLE")
        self.assertFalse(rep_nonexistent.evidence_available)

        with tempfile.TemporaryDirectory() as tmpdir:
            # Unsupported file extension
            text_file = Path(tmpdir) / "notes.txt"
            text_file.write_text("not an image")
            rep_txt = self.evaluator.evaluate(text_file)
            self.assertEqual(rep_txt.status, "UNAVAILABLE")

            # Corrupt image file
            corrupt_img = Path(tmpdir) / "corrupt.png"
            corrupt_img.write_bytes(b"corrupt header garbage data")
            rep_corrupt = self.evaluator.evaluate(corrupt_img)
            self.assertEqual(rep_corrupt.status, "UNAVAILABLE")

            # Empty directory
            empty_dir = Path(tmpdir) / "empty_dir"
            empty_dir.mkdir()
            rep_empty = self.evaluator.evaluate(empty_dir)
            self.assertEqual(rep_empty.status, "UNAVAILABLE")

    def test_evidence_hash_generation(self) -> None:
        """Requirement 8: Evidence hash is correctly generated and verifiable."""
        report = self.evaluator.evaluate(self.sample_01)
        self.assertIsNotNone(report.evidence_hash)
        self.assertEqual(len(report.evidence_hash), 64)

        # Re-derive payload and verify hash
        evidence_payload = {
            "type": "DISTRIBUTION_SHIFT_EVALUATION",
            "assessment_timestamp": report.assessment_timestamp,
            "classification": report.classification,
            "dimensions": [d.to_dict() for d in report.dimensions],
            "overall_drift_score": report.overall_drift_score,
            "overall_severity": report.overall_severity,
            "query_hash": report.query_hash,
            "query_target": report.query_target,
            "reference_fingerprint": report.reference_fingerprint,
            "status": report.status,
        }
        is_valid = verify_hash(evidence_payload, report.evidence_hash, is_json=True)
        self.assertTrue(is_valid)

    def test_ledger_insertion_and_verification(self) -> None:
        """Requirement 9: Active evaluation appends evidence to HashChainLedger and verifies chain."""
        ledger = HashChainLedger()
        self.assertEqual(ledger.length, 1)  # Genesis only

        report = self.evaluator.evaluate(self.sample_01, ledger=ledger)
        self.assertEqual(ledger.length, 2)

        last_record = ledger.get_last_record()
        self.assertIsNotNone(last_record)
        self.assertEqual(last_record.payload["type"], "DISTRIBUTION_SHIFT_EVALUATION")
        self.assertEqual(last_record.payload["evidence_hash"], report.evidence_hash)

        is_valid, error = ledger.verify_chain()
        self.assertTrue(is_valid)
        self.assertIsNone(error)

    def test_tampered_evidence_payload_detected(self) -> None:
        """Requirement 10: Tampered evidence payload triggers cryptographic verification failure."""
        report = self.evaluator.evaluate(self.sample_01)
        evidence_payload = {
            "type": "DISTRIBUTION_SHIFT_EVALUATION",
            "assessment_timestamp": report.assessment_timestamp,
            "classification": report.classification,
            "dimensions": [d.to_dict() for d in report.dimensions],
            "overall_drift_score": report.overall_drift_score,
            "overall_severity": report.overall_severity,
            "query_hash": report.query_hash,
            "query_target": report.query_target,
            "reference_fingerprint": report.reference_fingerprint,
            "status": report.status,
        }

        # Original payload verifies
        self.assertTrue(verify_hash(evidence_payload, report.evidence_hash, is_json=True))

        # Tamper 1: Alter drift score
        tampered_score = dict(evidence_payload)
        tampered_score["overall_drift_score"] = 0.9999
        self.assertFalse(verify_hash(tampered_score, report.evidence_hash, is_json=True))

        # Tamper 2: Alter classification
        tampered_class = dict(evidence_payload)
        tampered_class["classification"] = "OUT-OF-DISTRIBUTION"
        self.assertFalse(verify_hash(tampered_class, report.evidence_hash, is_json=True))

        # Tamper 3: Tamper a ledger record
        ledger = HashChainLedger()
        self.evaluator.evaluate(self.sample_01, ledger=ledger)
        ledger.records[-1].payload["status"] = "TAMPERED_RECORD"
        is_valid, _ = ledger.verify_chain()
        self.assertFalse(is_valid)

    def test_assurance_service_passive_backward_compatibility(self) -> None:
        """Verify AssuranceService preserves exact passive backward-compatible behavior."""
        service = AssuranceService()

        # Passive shift pillar evaluation
        pillar, count = service.evaluate_distribution_shift()
        self.assertEqual(pillar.id, "shift")
        self.assertEqual(pillar.status, "UNAVAILABLE")
        self.assertEqual(pillar.severity, "low")
        self.assertEqual(pillar.confidence, 0.0)
        self.assertFalse(pillar.evidenceAvailable)
        self.assertEqual(count, 0)

        # Passive full summary: exactly matches verified pre-existing state
        summary = service.build_assurance_summary()
        self.assertEqual(summary.globalDisposition, "REVIEW")
        self.assertEqual(summary.evidenceCount, 8)
        self.assertEqual(summary.unresolvedFlags, 0)
        self.assertEqual(len(summary.pillars), 5)

        verified_pillars = [p.id for p in summary.pillars if p.status == "VERIFIED"]
        self.assertEqual(verified_pillars, ["dataset", "model", "inference", "audit"])

        unavailable_pillars = [p.id for p in summary.pillars if p.status == "UNAVAILABLE"]
        self.assertEqual(unavailable_pillars, ["shift"])

    def test_assurance_service_active_query_evaluation(self) -> None:
        """Verify AssuranceService correctly evaluates active queries when supplied."""
        service = AssuranceService()

        # In-distribution active query
        pillar_valid, count_valid = service.evaluate_distribution_shift(
            query_target=str(self.sample_01)
        )
        self.assertEqual(pillar_valid.status, "VERIFIED")
        self.assertEqual(pillar_valid.severity, "low")
        self.assertTrue(pillar_valid.evidenceAvailable)
        self.assertEqual(count_valid, 1)

        # Active summary with in-distribution query yields full VERIFIED lifecycle
        summary_active = service.build_assurance_summary(
            shift_query_target=str(self.sample_01)
        )
        self.assertEqual(summary_active.globalDisposition, "VERIFIED")
        self.assertEqual(summary_active.unresolvedFlags, 0)
        self.assertGreaterEqual(summary_active.evidenceCount, 9)

        all_verified = [p.id for p in summary_active.pillars if p.status == "VERIFIED"]
        self.assertEqual(len(all_verified), 5)

    def test_scientific_limitation_disclosure(self) -> None:
        """Requirement H: Clearly disclose that the reference set contains only 3 sample images."""
        report = self.evaluator.evaluate(self.sample_01)
        self.assertIn("3 sample reference images", report.limitations)
        self.assertIn("DVC", report.limitations)
        self.assertEqual(report.limitations, SCIENTIFIC_LIMITATION)


if __name__ == "__main__":
    unittest.main()
