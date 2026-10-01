"""Tests for Model Integrity Verification and MLflow Tracking."""

import hashlib
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.model_integrity.tracker import record_verification_run
from ml.model_integrity.verifier import (
    ModelVerificationResult,
    hash_model_file,
    verify_model_integrity,
)


class TestModelIntegrity(unittest.TestCase):
    """Test suite for model cryptographic integrity checks and tracking."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.mkdtemp()
        self.sample_weights = b"\x08\x01\x12\x04ONNX\x1a\x10MOCK_MODEL_WEIGHTS_BINARY_123456"
        self.sample_model_path = Path(self.temp_dir) / "yolov8n_sample.onnx"
        self.sample_model_path.write_bytes(self.sample_weights)
        self.expected_hash = hashlib.sha256(self.sample_weights).hexdigest()

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_correct_hash_produces_match(self) -> None:
        """Verify that an untampered model file yields status MATCH."""
        result = verify_model_integrity(
            model_path=self.sample_model_path,
            expected_hash=self.expected_hash,
            model_name="yolov8n_sample",
        )

        self.assertEqual(result.status, "MATCH")
        self.assertEqual(result.model_hash, self.expected_hash)
        self.assertEqual(result.model_name, "yolov8n_sample")
        self.assertEqual(result.file_size_bytes, len(self.sample_weights))

    def test_modified_model_produces_mismatch(self) -> None:
        """Verify that any modification to model weights yields status MISMATCH."""
        # Intentionally tamper with expected hash
        wrong_hash = "0" * 64
        result = verify_model_integrity(
            model_path=self.sample_model_path,
            expected_hash=wrong_hash,
        )

        self.assertEqual(result.status, "MISMATCH")
        self.assertEqual(result.model_hash, self.expected_hash)
        self.assertNotEqual(result.model_hash, wrong_hash)

        # Tamper with file binary directly
        tampered_weights = self.sample_weights + b"\x00TAMPER"
        tampered_path = Path(self.temp_dir) / "tampered.onnx"
        tampered_path.write_bytes(tampered_weights)

        result_tampered = verify_model_integrity(
            model_path=tampered_path,
            expected_hash=self.expected_hash,
        )
        self.assertEqual(result_tampered.status, "MISMATCH")

    def test_missing_model_file_handled_safely(self) -> None:
        """Verify that non-existent model path raises FileNotFoundError safely."""
        missing_path = Path(self.temp_dir) / "non_existent_model.pt"
        with self.assertRaises(FileNotFoundError):
            hash_model_file(missing_path)

        with self.assertRaises(FileNotFoundError):
            verify_model_integrity(missing_path, expected_hash=self.expected_hash)

    def test_deterministic_hash_calculation(self) -> None:
        """Verify that hashing the same model multiple times produces the identical SHA-256."""
        hash1 = hash_model_file(self.sample_model_path)
        hash2 = hash_model_file(self.sample_model_path)

        self.assertEqual(hash1, hash2)
        self.assertEqual(len(hash1), 64)
        self.assertEqual(hash1, self.expected_hash)

    def test_structured_verification_result(self) -> None:
        """Verify that ModelVerificationResult produces the expected dictionary schema."""
        metadata = {"framework": "ONNX", "architecture": "YOLOv8n", "version": "1.0"}
        result = verify_model_integrity(
            model_path=self.sample_model_path,
            expected_hash=self.expected_hash,
            metadata=metadata,
        )

        result_dict = result.to_dict()
        expected_keys = {
            "model_name",
            "model_hash",
            "expected_hash",
            "status",
            "model_path",
            "file_size_bytes",
            "timestamp",
            "metadata",
        }
        self.assertTrue(expected_keys.issubset(result_dict.keys()))
        self.assertEqual(result_dict["metadata"]["framework"], "ONNX")

    def test_mlflow_local_run_recording(self) -> None:
        """Verify that MLflow records the verification run to a local tracking URI."""
        test_db_path = Path(self.temp_dir) / "test_mlflow.db"
        tracking_uri = f"sqlite:///{test_db_path.as_posix()}"

        result = verify_model_integrity(
            model_path=self.sample_model_path,
            expected_hash=self.expected_hash,
            model_name="yolo_test_run",
            metadata={"framework": "ONNX", "version": "1.0"},
        )

        tracking_info = record_verification_run(
            result=result,
            experiment_name="Test_Integrity_Experiment",
            tracking_uri=tracking_uri,
        )

        self.assertIn("run_id", tracking_info)
        self.assertIn("experiment_id", tracking_info)
        self.assertEqual(tracking_info["status"], "MATCH")
        self.assertTrue(test_db_path.exists())


if __name__ == "__main__":
    unittest.main()
