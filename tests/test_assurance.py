"""Tests for Backend Evaluation & Assurance Pipeline (PS ID 26228).

Covers:
- Valid assurance summary (complete verification)
- Missing/incomplete evaluation evidence handling
- Unresolved flags calculation
- Evidence count aggregation
- Deterministic response structure
- API endpoint GET /api/v1/assurance/summary response contract
- Preservation of existing system endpoints
"""

from datetime import datetime
from pathlib import Path
import sys
import tempfile
import unittest

from fastapi.testclient import TestClient

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app
from backend.app.models.schemas import AssurancePillar, AssuranceSummaryData
from backend.app.services.assurance_service import (
    AssuranceService,
    get_default_assurance_service,
)
from blockchain.ledger.hash_chain import HashChainLedger


class TestAssurancePipeline(unittest.TestCase):
    """Test suite for the multi-pillar assurance service and API endpoint."""

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.service = AssuranceService()

    def test_api_endpoint_response_contract(self) -> None:
        """Verify GET /api/v1/assurance/summary adheres to the agreed envelope and schema."""
        response = self.client.get("/api/v1/assurance/summary")
        self.assertEqual(response.status_code, 200)

        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertIsNone(body["error"])
        self.assertIn("timestamp", body)

        # Validate timestamp parseability
        parsed_time = datetime.fromisoformat(body["timestamp"])
        self.assertIsNotNone(parsed_time)

        data = body["data"]
        # Required assurance fields
        self.assertIn("globalDisposition", data)
        self.assertIn("globalReason", data)
        self.assertIn("evidenceCount", data)
        self.assertIn("unresolvedFlags", data)
        self.assertIn("pillars", data)
        self.assertIn("assessmentTimestamp", data)

        self.assertIsInstance(data["pillars"], list)
        self.assertEqual(len(data["pillars"]), 5)

        pillar_ids = [p["id"] for p in data["pillars"]]
        self.assertEqual(
            pillar_ids,
            ["dataset", "model", "inference", "shift", "audit"],
        )

        # Verify pillar schema fields
        for pillar in data["pillars"]:
            self.assertIn("id", pillar)
            self.assertIn("title", pillar)
            self.assertIn("status", pillar)
            self.assertIn("severity", pillar)
            self.assertIn("confidence", pillar)
            self.assertIn("asset", pillar)
            self.assertIn("explanation", pillar)
            self.assertIn("evidenceAvailable", pillar)
            self.assertGreaterEqual(pillar["confidence"], 0.0)
            self.assertLessEqual(pillar["confidence"], 1.0)

    def test_valid_complete_assurance_summary(self) -> None:
        """Verify that when all 5 pillars pass verification, global disposition is VERIFIED."""
        dataset_p = AssurancePillar(
            id="dataset",
            title="Training Data Integrity",
            status="VERIFIED",
            severity="low",
            confidence=0.96,
            asset="Dataset: Sector-7",
            explanation="Clean dataset, 0 duplicates, 0 corruptions.",
            evidenceAvailable=True,
        )
        model_p = AssurancePillar(
            id="model",
            title="Model Integrity",
            status="VERIFIED",
            severity="low",
            confidence=0.99,
            asset="Model: yolov8n.pt",
            explanation="SHA-256 weight hash matches registry.",
            evidenceAvailable=True,
        )
        inf_p = AssurancePillar(
            id="inference",
            title="Inference Provenance",
            status="VERIFIED",
            severity="low",
            confidence=0.98,
            asset="Inference Binding #INF-101",
            explanation="Cryptographic binding verified.",
            evidenceAvailable=True,
        )
        shift_p = AssurancePillar(
            id="shift",
            title="Distribution Shift & Anomaly",
            status="VERIFIED",
            severity="low",
            confidence=0.91,
            asset="Operational Reference",
            explanation="No distribution shift detected.",
            evidenceAvailable=True,
        )
        ledger_p = AssurancePillar(
            id="audit",
            title="Tamper-Evident Audit Trail",
            status="VERIFIED",
            severity="low",
            confidence=1.0,
            asset="Ledger (Height: 5)",
            explanation="Chain verified.",
            evidenceAvailable=True,
        )

        summary = self.service.build_assurance_summary(
            dataset_pillar=dataset_p,
            dataset_evidence_count=10,
            model_pillar=model_p,
            model_evidence_count=1,
            inference_pillar=inf_p,
            inference_evidence_count=1,
            shift_pillar=shift_p,
            shift_evidence_count=1,
            ledger_pillar=ledger_p,
            ledger_evidence_count=5,
        )

        self.assertEqual(summary.globalDisposition, "VERIFIED")
        self.assertEqual(summary.unresolvedFlags, 0)
        self.assertEqual(summary.evidenceCount, 18)
        self.assertIn("All core computer vision lifecycle stages verified", summary.globalReason)

    def test_missing_incomplete_evaluation_evidence(self) -> None:
        """Verify explicit UNAVAILABLE representation when evaluation evidence is missing."""
        with tempfile.TemporaryDirectory() as empty_dir:
            # Point to non-existent files/directories
            custom_service = AssuranceService(
                dataset_dir=Path(empty_dir) / "non_existent_dataset",
                model_path=Path(empty_dir) / "non_existent_model.pt",
                sample_image_path=Path(empty_dir) / "missing.png",
            )

            pillar_ds, ds_ev = custom_service.evaluate_dataset()
            self.assertEqual(pillar_ds.status, "UNAVAILABLE")
            self.assertFalse(pillar_ds.evidenceAvailable)
            self.assertEqual(pillar_ds.confidence, 0.0)
            self.assertEqual(ds_ev, 0)

            pillar_md, md_ev = custom_service.evaluate_model()
            self.assertEqual(pillar_md.status, "UNAVAILABLE")
            self.assertFalse(pillar_md.evidenceAvailable)
            self.assertEqual(pillar_md.confidence, 0.0)
            self.assertEqual(md_ev, 0)

            pillar_inf, inf_ev = custom_service.evaluate_inference()
            self.assertEqual(pillar_inf.status, "UNAVAILABLE")
            self.assertFalse(pillar_inf.evidenceAvailable)
            self.assertEqual(inf_ev, 0)

            summary = custom_service.build_assurance_summary()
            self.assertEqual(summary.globalDisposition, "REVIEW")
            self.assertIn("Partial lifecycle assurance", summary.globalReason)

    def test_unresolved_flags_and_tamper_detection(self) -> None:
        """Verify that tampered pillars trigger critical severity and increment unresolvedFlags."""
        dataset_p = AssurancePillar(
            id="dataset",
            title="Training Data Integrity",
            status="REVIEW",
            severity="medium",
            confidence=0.85,
            asset="Dataset: Contributed-04",
            explanation="12 duplicate clusters detected.",
            evidenceAvailable=True,
        )
        model_p = AssurancePillar(
            id="model",
            title="Model Integrity",
            status="TAMPERED",
            severity="critical",
            confidence=1.0,
            asset="Model: yolov8n.pt",
            explanation="Cryptographic mismatch: computed hash differs from registry.",
            evidenceAvailable=True,
        )

        summary = self.service.build_assurance_summary(
            dataset_pillar=dataset_p,
            model_pillar=model_p,
        )

        self.assertEqual(summary.globalDisposition, "TAMPERED")
        self.assertGreaterEqual(summary.unresolvedFlags, 2)
        self.assertIn("Critical cryptographic tampering detected", summary.globalReason)
        self.assertIn("Model Integrity", summary.globalReason)

    def test_evidence_count_calculation(self) -> None:
        """Verify evidence count accurately aggregates verified proofs across all active pillars."""
        ledger = HashChainLedger()
        ledger.append_record({"test_event": "1"})
        ledger.append_record({"test_event": "2"})
        # 1 genesis + 2 appends = 3 blocks
        self.assertEqual(ledger.length, 3)

        service = AssuranceService(ledger=ledger)
        summary = service.build_assurance_summary()

        # At minimum: 3 dataset images + 1 model + 1 inference + 3 ledger blocks = 8
        self.assertGreaterEqual(summary.evidenceCount, 8)

    def test_deterministic_response_structure(self) -> None:
        """Verify that multiple summary generations yield deterministic structures."""
        service = get_default_assurance_service()
        summary_1 = service.build_assurance_summary()
        summary_2 = service.build_assurance_summary()

        dict_1 = summary_1.model_dump()
        dict_2 = summary_2.model_dump()

        # Both should match on non-timestamp fields
        self.assertEqual(dict_1["globalDisposition"], dict_2["globalDisposition"])
        self.assertEqual(dict_1["globalReason"], dict_2["globalReason"])
        self.assertEqual(dict_1["evidenceCount"], dict_2["evidenceCount"])
        self.assertEqual(dict_1["unresolvedFlags"], dict_2["unresolvedFlags"])
        self.assertEqual(len(dict_1["pillars"]), len(dict_2["pillars"]))

        for p1, p2 in zip(dict_1["pillars"], dict_2["pillars"]):
            self.assertEqual(p1["id"], p2["id"])
            self.assertEqual(p1["status"], p2["status"])
            self.assertEqual(p1["severity"], p2["severity"])
            self.assertEqual(p1["confidence"], p2["confidence"])

    def test_existing_endpoints_preserved(self) -> None:
        """Verify GET /api/v1/health and GET /api/v1/system/overview remain completely untouched."""
        health_res = self.client.get("/api/v1/health")
        self.assertEqual(health_res.status_code, 200)
        self.assertEqual(health_res.json()["data"]["status"], "ok")

        overview_res = self.client.get("/api/v1/system/overview")
        self.assertEqual(overview_res.status_code, 200)
        self.assertEqual(
            overview_res.json()["data"]["project"],
            "Trusted Computer Vision Assurance",
        )
        self.assertTrue(overview_res.json()["data"]["components"]["tamper_evident_ledger"])


if __name__ == "__main__":
    unittest.main()
