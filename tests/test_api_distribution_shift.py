"""Integration Tests for Active Distribution Shift & Anomaly Evaluation API (PS ID 26228).

Verifies:
A. Valid in-distribution image upload -> HTTP 200, VERIFIED, IN-DISTRIBUTION, evidence created, ledger record logged.
B. Operational drift image upload -> HTTP 200, REVIEW, OPERATIONAL DRIFT / OUT-OF-DISTRIBUTION.
C. Corrupt/non-image upload -> HTTP 400, structured error envelope, no ledger record.
D. Unsupported extension upload -> HTTP 400, structured error envelope, no ledger record.
E. Oversized upload (> 10 MB) -> HTTP 413, structured error envelope, no ledger record.
F. Temporary file cleanup -> confirms no leaked temporary files on disk.
G. Passive summary regression -> GET /api/v1/assurance/summary unchanged, no new ledger records.
H. Cryptographic tamper & evidence verification -> verifies hash calculation and detects mutations.
I. Existing system endpoints -> GET /api/v1/health and GET /api/v1/system/overview unaffected.
"""

from datetime import datetime
import json
from pathlib import Path
import sys
import tempfile
import unittest

import cv2
from fastapi.testclient import TestClient
import numpy as np

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app
from backend.app.services.assurance_service import get_default_assurance_service
from backend.app.utils.crypto_utils import verify_hash


class TestActiveDistributionShiftAPI(unittest.TestCase):
    """Test suite for POST /api/v1/assurance/distribution-shift/evaluate."""

    def setUp(self) -> None:
        import backend.app.services.assurance_service as as_module

        as_module._default_service = None
        self.service = as_module.get_default_assurance_service()
        self.client = TestClient(app)
        self.sample_01 = PROJECT_ROOT / "data" / "sample" / "sample_01.png"

    def test_valid_in_distribution_image_upload(self) -> None:
        """Requirement A: Uploading valid in-distribution image yields HTTP 200, VERIFIED, IN-DISTRIBUTION."""
        ledger = self.service._get_or_create_ledger()
        initial_ledger_len = ledger.length

        with open(self.sample_01, "rb") as f:
            response = self.client.post(
                "/api/v1/assurance/distribution-shift/evaluate",
                files={"file": ("sample_01.png", f, "image/png")},
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertIsNone(body["error"])
        self.assertIn("timestamp", body)

        data = body["data"]
        self.assertEqual(data["status"], "VERIFIED")
        self.assertEqual(data["classification"], "IN-DISTRIBUTION")
        self.assertEqual(data["overallSeverity"], "low")
        self.assertLessEqual(data["overallDriftScore"], 0.15)
        self.assertTrue(data["evidenceAvailable"])
        self.assertIsNotNone(data["evidenceHash"])
        self.assertEqual(len(data["evidenceHash"]), 64)
        self.assertIsNotNone(data["ledgerRecordIndex"])
        self.assertEqual(data["queryTarget"], "sample_01.png")

        # Verify dimensions list
        self.assertIsInstance(data["dimensions"], list)
        self.assertEqual(len(data["dimensions"]), 4)
        dim_names = {d["dimension"] for d in data["dimensions"]}
        self.assertEqual(
            dim_names,
            {"Illumination", "Contrast", "Color Spectrum", "Spatial Sharpness"},
        )

        # Verify ledger updated exactly by 1 record
        self.assertEqual(ledger.length, initial_ledger_len + 1)
        last_rec = ledger.get_last_record()
        self.assertIsNotNone(last_rec)
        self.assertEqual(last_rec.payload["type"], "DISTRIBUTION_SHIFT_EVALUATION")
        self.assertEqual(last_rec.payload["evidence_hash"], data["evidenceHash"])

        # Verify chain integrity
        is_valid, err = ledger.verify_chain()
        self.assertTrue(is_valid)
        self.assertIsNone(err)

    def test_operational_drift_image_upload(self) -> None:
        """Requirement B: Uploading modified image with significant drift yields HTTP 200, REVIEW, OPERATIONAL DRIFT."""
        img = cv2.imread(str(self.sample_01))
        # Heavily darken image to trigger illumination & contrast drift
        darkened = np.clip(img.astype(np.int32) - 100, 0, 255).astype(np.uint8)
        success, encoded = cv2.imencode(".png", darkened)
        self.assertTrue(success)
        png_bytes = encoded.tobytes()

        response = self.client.post(
            "/api/v1/assurance/distribution-shift/evaluate",
            files={"file": ("darkened_sample.png", png_bytes, "image/png")},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        data = body["data"]

        self.assertEqual(data["status"], "REVIEW")
        self.assertIn(data["classification"], ("OPERATIONAL DRIFT", "OUT-OF-DISTRIBUTION"))
        self.assertGreater(data["overallDriftScore"], 0.15)
        self.assertIn(data["overallSeverity"], ("medium", "high"))
        self.assertTrue(data["evidenceAvailable"])
        self.assertIsNotNone(data["evidenceHash"])

    def test_corrupt_non_image_upload_rejected(self) -> None:
        """Requirement C: Uploading corrupt or non-image data yields HTTP 400 and creates NO ledger record."""
        ledger = self.service._get_or_create_ledger()
        initial_ledger_len = ledger.length

        corrupt_bytes = b"This is plain text with a fraudulent png extension"
        response = self.client.post(
            "/api/v1/assurance/distribution-shift/evaluate",
            files={"file": ("corrupt.png", corrupt_bytes, "image/png")},
        )

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertEqual(body["status"], "error")
        self.assertIsNone(body["data"])
        self.assertIn("corrupt or not a valid readable image", body["error"])

        # Confirm ledger was not modified
        self.assertEqual(ledger.length, initial_ledger_len)

    def test_unsupported_extension_upload_rejected(self) -> None:
        """Requirement D: Uploading unsupported extension yields HTTP 400 and creates NO ledger record."""
        ledger = self.service._get_or_create_ledger()
        initial_ledger_len = ledger.length

        response = self.client.post(
            "/api/v1/assurance/distribution-shift/evaluate",
            files={"file": ("script.sh", b"#!/bin/bash\necho hello", "text/x-sh")},
        )

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertEqual(body["status"], "error")
        self.assertIsNone(body["data"])
        self.assertIn("Unsupported image extension '.sh'", body["error"])

        # Confirm ledger was not modified
        self.assertEqual(ledger.length, initial_ledger_len)

    def test_oversized_upload_rejected(self) -> None:
        """Requirement E: Upload exceeding 10 MB limit yields HTTP 413 and creates NO ledger record."""
        ledger = self.service._get_or_create_ledger()
        initial_ledger_len = ledger.length

        # Create dummy buffer exceeding 10 MB (10 MB + 1024 bytes)
        oversized_data = b"0" * (10 * 1024 * 1024 + 1024)
        response = self.client.post(
            "/api/v1/assurance/distribution-shift/evaluate",
            files={"file": ("large_image.png", oversized_data, "image/png")},
        )

        self.assertEqual(response.status_code, 413)
        body = response.json()
        self.assertEqual(body["status"], "error")
        self.assertIsNone(body["data"])
        self.assertIn("exceeds maximum limit of 10 MB", body["error"])

        # Confirm ledger was not modified
        self.assertEqual(ledger.length, initial_ledger_len)

    def test_missing_file_payload(self) -> None:
        """Verify request with omitted file upload returns clean HTTP 400 error envelope."""
        response = self.client.post("/api/v1/assurance/distribution-shift/evaluate")
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertEqual(body["status"], "error")
        self.assertIn("Missing required image file upload", body["error"])

    def test_temporary_file_cleanup_after_request(self) -> None:
        """Requirement F: Confirm temporary files are cleaned up and not leaked on disk."""
        # Find all files in system temp directory matching pattern before
        temp_dir = Path(tempfile.gettempdir())
        before_temp_files = set(temp_dir.glob("tmp*.png"))

        with open(self.sample_01, "rb") as f:
            res = self.client.post(
                "/api/v1/assurance/distribution-shift/evaluate",
                files={"file": ("sample_01.png", f, "image/png")},
            )
        self.assertEqual(res.status_code, 200)

        # After request completes, no new unlinked temporary files should remain
        after_temp_files = set(temp_dir.glob("tmp*.png"))
        leaked_files = after_temp_files - before_temp_files
        self.assertEqual(len(leaked_files), 0, f"Leaked temporary files detected: {leaked_files}")

    def test_passive_summary_regression_and_ledger_immutability(self) -> None:
        """Requirement G: Passive GET /api/v1/assurance/summary remains unchanged and creates NO ledger records."""
        ledger = self.service._get_or_create_ledger()
        ledger_height_before = ledger.length

        # Call passive summary endpoint multiple times
        for _ in range(3):
            response = self.client.get("/api/v1/assurance/summary")
            self.assertEqual(response.status_code, 200)
            body = response.json()
            data = body["data"]

            self.assertEqual(data["globalDisposition"], "REVIEW")
            self.assertEqual(data["evidenceCount"], 8)
            self.assertEqual(data["unresolvedFlags"], 0)
            self.assertEqual(len(data["pillars"]), 5)

            shift_pillar = next(p for p in data["pillars"] if p["id"] == "shift")
            self.assertEqual(shift_pillar["status"], "UNAVAILABLE")
            self.assertEqual(shift_pillar["confidence"], 0.0)
            self.assertFalse(shift_pillar["evidenceAvailable"])

        # Ledger height must remain strictly unchanged across passive calls
        self.assertEqual(ledger.length, ledger_height_before)

    def test_tamper_evidence_verification(self) -> None:
        """Requirement H: Evidence hash is cryptographically verifiable and tampering is detected."""
        with open(self.sample_01, "rb") as f:
            response = self.client.post(
                "/api/v1/assurance/distribution-shift/evaluate",
                files={"file": ("sample_01.png", f, "image/png")},
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        evidence_hash = data["evidenceHash"]

        # Retrieve authentic evidence payload from the ledger
        ledger = self.service._get_or_create_ledger()
        last_rec = ledger.get_last_record()
        self.assertIsNotNone(last_rec)
        evidence_payload = dict(last_rec.payload)
        evidence_hash_in_rec = evidence_payload.pop("evidence_hash")
        self.assertEqual(evidence_hash_in_rec, evidence_hash)

        # Authentic payload verifies
        self.assertTrue(verify_hash(evidence_payload, evidence_hash, is_json=True))

        # Tampered score fails
        tampered_score = dict(evidence_payload)
        tampered_score["overall_drift_score"] = 0.9999
        self.assertFalse(verify_hash(tampered_score, evidence_hash, is_json=True))

        # Tampered classification fails
        tampered_class = dict(evidence_payload)
        tampered_class["classification"] = "OUT-OF-DISTRIBUTION"
        self.assertFalse(verify_hash(tampered_class, evidence_hash, is_json=True))

    def test_existing_system_endpoints_unaffected(self) -> None:
        """Requirement I: Existing /health and /system/overview endpoints remain 100% functional."""
        res_health = self.client.get("/api/v1/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json()["data"]["status"], "ok")

        res_overview = self.client.get("/api/v1/system/overview")
        self.assertEqual(res_overview.status_code, 200)
        self.assertEqual(res_overview.json()["data"]["project"], "Trusted Computer Vision Assurance")

    def test_summary_reflects_post_distribution_shift_evaluation(self) -> None:
        """GET /assurance/summary reflects latest verified shift evaluation after POST."""
        # 1. Before POST: shift pillar is UNAVAILABLE
        res_before = self.client.get("/api/v1/assurance/summary")
        self.assertEqual(res_before.status_code, 200)
        data_before = res_before.json()["data"]
        shift_before = next(p for p in data_before["pillars"] if p["id"] == "shift")
        self.assertEqual(shift_before["status"], "UNAVAILABLE")
        self.assertFalse(shift_before["evidenceAvailable"])
        self.assertIn("awaiting query image evaluation", shift_before["explanation"])

        # 2. Perform live evaluation via POST
        with open(self.sample_01, "rb") as f:
            res_post = self.client.post(
                "/api/v1/assurance/distribution-shift/evaluate",
                files={"file": ("sample_01.png", f, "image/png")},
            )
        self.assertEqual(res_post.status_code, 200)
        post_data = res_post.json()["data"]
        self.assertEqual(post_data["status"], "VERIFIED")

        # 3. After POST: shift pillar in GET /assurance/summary reflects verified evaluation
        res_after = self.client.get("/api/v1/assurance/summary")
        self.assertEqual(res_after.status_code, 200)
        data_after = res_after.json()["data"]
        shift_after = next(p for p in data_after["pillars"] if p["id"] == "shift")

        self.assertEqual(shift_after["status"], "VERIFIED")
        self.assertEqual(shift_after["severity"], "low")
        self.assertTrue(shift_after["evidenceAvailable"])
        self.assertGreaterEqual(shift_after["confidence"], 0.90)
        self.assertEqual(shift_after["asset"], "Shift Analysis: sample_01.png")
        self.assertIn("drift score:", shift_after["explanation"])
        self.assertNotIn("not yet deployed", shift_after["explanation"])
        self.assertNotIn("awaiting query image evaluation", shift_after["explanation"])

        # All 5 pillars verified -> global disposition VERIFIED
        self.assertEqual(data_after["globalDisposition"], "VERIFIED")
        self.assertIn("All core computer vision lifecycle stages verified", data_after["globalReason"])

    def test_summary_ignores_invalid_or_tampered_ledger_record(self) -> None:
        """Ledger-aware summary skips tampered or corrupted shift records."""
        ledger = self.service._get_or_create_ledger()

        # Append a shift record with tampered evidence_hash
        tampered_payload = {
            "type": "DISTRIBUTION_SHIFT_EVALUATION",
            "query_target": "fake_image.png",
            "status": "VERIFIED",
            "overall_severity": "low",
            "overall_drift_score": 0.01,
            "overall_confidence": 0.99,
            "evidence_hash": "a" * 64,  # Fraudulent hash
        }
        ledger.append_record(tampered_payload)

        # GET /assurance/summary should ignore the tampered record and remain UNAVAILABLE
        res = self.client.get("/api/v1/assurance/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        shift_pillar = next(p for p in data["pillars"] if p["id"] == "shift")
        self.assertEqual(shift_pillar["status"], "UNAVAILABLE")
        self.assertFalse(shift_pillar["evidenceAvailable"])

    def test_summary_uses_latest_of_multiple_ledger_records(self) -> None:
        """GET /assurance/summary reflects the most recent valid evaluation when multiple exist."""
        # 1. First evaluation: in-distribution sample_01.png
        with open(self.sample_01, "rb") as f:
            res1 = self.client.post(
                "/api/v1/assurance/distribution-shift/evaluate",
                files={"file": ("sample_01.png", f, "image/png")},
            )
        self.assertEqual(res1.status_code, 200)

        # 2. Second evaluation: darkened image (operational drift)
        img = cv2.imread(str(self.sample_01))
        darkened = np.clip(img.astype(np.int32) - 100, 0, 255).astype(np.uint8)
        _, encoded = cv2.imencode(".png", darkened)
        res2 = self.client.post(
            "/api/v1/assurance/distribution-shift/evaluate",
            files={"file": ("darkened_sample.png", encoded.tobytes(), "image/png")},
        )
        self.assertEqual(res2.status_code, 200)

        # 3. GET /assurance/summary must reflect the latest (second) evaluation
        res_summary = self.client.get("/api/v1/assurance/summary")
        self.assertEqual(res_summary.status_code, 200)
        data = res_summary.json()["data"]
        shift_pillar = next(p for p in data["pillars"] if p["id"] == "shift")

        self.assertEqual(shift_pillar["status"], "REVIEW")
        self.assertEqual(shift_pillar["asset"], "Shift Analysis: darkened_sample.png")
        self.assertTrue(shift_pillar["evidenceAvailable"])
        self.assertIn("drift detected", shift_pillar["explanation"])

    def test_summary_does_not_mutate_ledger_when_reading_shift_record(self) -> None:
        """GET /assurance/summary preserves ledger immutability and creates zero records."""
        # Evaluate one image
        with open(self.sample_01, "rb") as f:
            res = self.client.post(
                "/api/v1/assurance/distribution-shift/evaluate",
                files={"file": ("sample_01.png", f, "image/png")},
            )
        self.assertEqual(res.status_code, 200)

        ledger = self.service._get_or_create_ledger()
        height_before = ledger.length

        # Call GET /assurance/summary 3 times
        for _ in range(3):
            res_summary = self.client.get("/api/v1/assurance/summary")
            self.assertEqual(res_summary.status_code, 200)

        # Ledger length must remain identical
        self.assertEqual(ledger.length, height_before)


if __name__ == "__main__":
    unittest.main()
