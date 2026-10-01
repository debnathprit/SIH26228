"""Tests for cryptographic utilities."""

import hashlib
from pathlib import Path
import sys
import tempfile
import unittest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.utils.crypto_utils import (
    canonicalize_json,
    generate_evidence_hash,
    sha256_bytes,
    sha256_file,
    sha256_json,
    sha256_str,
    verify_hash,
)


class TestCryptoUtils(unittest.TestCase):
    """Test suite for SHA-256 cryptographic utilities."""

    def test_identical_input_produces_identical_sha256_hash(self) -> None:
        """Verify that identical byte and string inputs consistently yield identical SHA-256 hashes."""
        sample_bytes = b"Trustworthy Computer Vision Integrity"
        sample_str = "Trustworthy Computer Vision Integrity"

        hash1 = sha256_bytes(sample_bytes)
        hash2 = sha256_bytes(sample_bytes)
        hash_str = sha256_str(sample_str)

        self.assertEqual(hash1, hash2)
        self.assertEqual(hash1, hash_str)
        self.assertEqual(len(hash1), 64)
        # Verify against hashlib directly
        expected = hashlib.sha256(sample_bytes).hexdigest()
        self.assertEqual(hash1, expected)

    def test_different_input_produces_different_hash(self) -> None:
        """Verify that any variance in input changes the SHA-256 digest."""
        hash_original = sha256_str("Prediction: Vehicle, Confidence: 0.96")
        hash_modified = sha256_str("Prediction: Person, Confidence: 0.96")

        self.assertNotEqual(hash_original, hash_modified)

    def test_canonical_json_determinism(self) -> None:
        """Verify that dictionaries with different key orders produce identical canonical hashes."""
        dict_a = {
            "prediction": "vehicle",
            "confidence": 0.964,
            "bbox": [10, 20, 100, 200],
            "model_version": "v1.0",
        }
        dict_b = {
            "model_version": "v1.0",
            "bbox": [10, 20, 100, 200],
            "confidence": 0.964,
            "prediction": "vehicle",
        }

        canonical_a = canonicalize_json(dict_a)
        canonical_b = canonicalize_json(dict_b)
        self.assertEqual(canonical_a, canonical_b)

        hash_a = sha256_json(dict_a)
        hash_b = sha256_json(dict_b)
        self.assertEqual(hash_a, hash_b)

    def test_file_hashing_works(self) -> None:
        """Verify that file hashing reads file contents and produces the expected SHA-256."""
        content = b"Model weights binary simulation data 12345"
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            file_hash = sha256_file(tmp_path)
            expected_hash = hashlib.sha256(content).hexdigest()
            self.assertEqual(file_hash, expected_hash)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_evidence_hash_generation_and_verification(self) -> None:
        """Verify end-to-end evidence hash formulation and verification."""
        input_hash = sha256_str("dummy_image_pixels")
        model_hash = sha256_str("dummy_model_weights")
        prediction = {"class": "vehicle", "confidence": 0.964}
        timestamp = "2026-10-01T12:00:00Z"

        evidence_hash = generate_evidence_hash(
            input_hash=input_hash,
            model_hash=model_hash,
            prediction_data=prediction,
            timestamp=timestamp,
        )
        self.assertEqual(len(evidence_hash), 64)

        # Verification of unmodified payload succeeds
        payload = {
            "input_hash": input_hash,
            "model_hash": model_hash,
            "prediction": prediction,
            "timestamp": timestamp,
        }
        self.assertTrue(verify_hash(payload, evidence_hash, is_json=True))

        # Verification of tampered payload fails
        tampered_payload = {
            "input_hash": input_hash,
            "model_hash": model_hash,
            "prediction": {"class": "person", "confidence": 0.964},
            "timestamp": timestamp,
        }
        self.assertFalse(verify_hash(tampered_payload, evidence_hash, is_json=True))


if __name__ == "__main__":
    unittest.main()
