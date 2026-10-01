"""Tests for FastAPI backend foundation and system endpoints."""

from datetime import datetime
from pathlib import Path
import sys
import unittest

from fastapi.testclient import TestClient

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app


class TestSystemAPI(unittest.TestCase):
    """Test suite for health, system overview, envelope contract, and CORS."""

    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_endpoint_success_and_envelope(self) -> None:
        """Verify GET /api/v1/health returns HTTP 200 and matches the exact envelope."""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)

        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertIsNone(body["error"])
        self.assertIn("timestamp", body)

        # Check timestamp is ISO-8601 compliant
        parsed_time = datetime.fromisoformat(body["timestamp"])
        self.assertIsNotNone(parsed_time)

        # Check data payload
        data = body["data"]
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["version"], "1.0.0")

    def test_system_overview_success_and_components(self) -> None:
        """Verify GET /api/v1/system/overview returns HTTP 200 and accurate components."""
        response = self.client.get("/api/v1/system/overview")
        self.assertEqual(response.status_code, 200)

        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertIsNone(body["error"])
        self.assertIn("timestamp", body)

        data = body["data"]
        self.assertEqual(data["project"], "Trusted Computer Vision Assurance")
        self.assertEqual(data["api_version"], "v1")

        # Verify all actual implemented subsystems are flagged true
        components = data["components"]
        expected_components = [
            "dataset_integrity",
            "model_integrity",
            "computer_vision_inference",
            "cryptographic_evidence",
            "tamper_evident_ledger",
            "mlflow_tracking",
            "dvc_dataset_versioning",
        ]
        for comp in expected_components:
            self.assertIn(comp, components)
            self.assertTrue(components[comp])

    def test_cors_headers_allowed_origin(self) -> None:
        """Verify CORS headers properly allow frontend origin http://localhost:5174."""
        headers = {
            "Origin": "http://localhost:5174",
            "Access-Control-Request-Method": "GET",
        }
        response = self.client.options("/api/v1/health", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "http://localhost:5174",
        )

        # Actual GET request with Origin
        get_res = self.client.get("/api/v1/health", headers={"Origin": "http://localhost:5174"})
        self.assertEqual(
            get_res.headers.get("access-control-allow-origin"),
            "http://localhost:5174",
        )

    def test_cors_headers_disallow_unregistered_origin(self) -> None:
        """Verify CORS does not mirror an unauthorized origin."""
        headers = {"Origin": "http://untrusted-domain.com"}
        response = self.client.get("/api/v1/health", headers=headers)
        self.assertNotEqual(
            response.headers.get("access-control-allow-origin"),
            "http://untrusted-domain.com",
        )


if __name__ == "__main__":
    unittest.main()
