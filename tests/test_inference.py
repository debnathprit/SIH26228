"""Tests for Computer Vision Inference Engine and MLflow Logging."""

import hashlib
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

from PIL import Image

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.utils.crypto_utils import sha256_file
from ml.inference.detector import (
    DetectionBox,
    InferenceResult,
    YOLOInferenceEngine,
    run_inference,
)


class TestInferenceEngine(unittest.TestCase):
    """Test suite for CV inference, hash binding, and error handling."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.mkdtemp()

        # Create synthetic valid test image
        self.image_path = Path(self.temp_dir) / "test_vehicle.png"
        img = Image.new("RGB", (320, 240), color=(50, 100, 150))
        img.save(str(self.image_path), format="PNG")
        self.expected_image_hash = sha256_file(self.image_path)

        # Create synthetic model weights file
        self.model_path = Path(self.temp_dir) / "yolov8n.pt"
        self.model_path.write_bytes(b"\x00MOCK_YOLO_WEIGHTS_BINARY_DATA\x01\x02\x03")
        self.expected_model_hash = sha256_file(self.model_path)

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _mock_detector(self, img_path: str, threshold: float) -> list[DetectionBox]:
        """Mock detector returning deterministic detections without external model."""
        return [
            DetectionBox(
                class_name="vehicle",
                confidence=0.9642,
                bbox=[15.0, 25.5, 120.0, 200.0],
                class_id=2,
            ),
            DetectionBox(
                class_name="person",
                confidence=0.8210,
                bbox=[140.0, 30.0, 180.0, 190.0],
                class_id=0,
            ),
        ]

    def test_valid_inference_output_structure(self) -> None:
        """Verify that inference returns all required fields in the expected types."""
        engine = YOLOInferenceEngine(
            model_path=self.model_path,
            model_name="yolov8n_demo",
            mock_detector=self._mock_detector,
        )

        result = engine.infer(self.image_path, record_mlflow=False)

        self.assertIsInstance(result, InferenceResult)
        self.assertEqual(result.primary_label, "vehicle")
        self.assertAlmostEqual(result.confidence, 0.9642, places=3)
        self.assertEqual(len(result.bbox), 4)
        self.assertEqual(result.total_detections, 2)
        self.assertEqual(result.model_name, "yolov8n_demo")
        self.assertTrue(len(result.inference_id) > 10)

    def test_class_confidence_and_bbox_fields(self) -> None:
        """Verify that detection fields and bounding boxes match detected objects."""
        engine = YOLOInferenceEngine(
            model_path=self.model_path,
            mock_detector=self._mock_detector,
        )

        result = engine.infer(self.image_path, record_mlflow=False)

        # Primary label must be top confidence detection
        self.assertEqual(result.primary_label, "vehicle")
        self.assertEqual(result.confidence, 0.9642)
        self.assertEqual(result.bbox, [15.0, 25.5, 120.0, 200.0])

        # Detections list must contain both objects
        self.assertEqual(len(result.detections), 2)
        self.assertEqual(result.detections[1]["class_name"], "person")

    def test_input_and_model_hash_generation(self) -> None:
        """Verify that the engine cryptographically binds input image and model hashes."""
        engine = YOLOInferenceEngine(
            model_path=self.model_path,
            mock_detector=self._mock_detector,
        )

        result = engine.infer(self.image_path, record_mlflow=False)

        self.assertEqual(result.input_hash, self.expected_image_hash)
        self.assertEqual(result.model_hash, self.expected_model_hash)
        self.assertEqual(len(result.input_hash), 64)
        self.assertEqual(len(result.model_hash), 64)

    def test_missing_image_handled_safely(self) -> None:
        """Verify that missing image file raises FileNotFoundError."""
        engine = YOLOInferenceEngine(
            model_path=self.model_path,
            mock_detector=self._mock_detector,
        )
        non_existent = Path(self.temp_dir) / "does_not_exist.png"

        with self.assertRaises(FileNotFoundError):
            engine.infer(non_existent)

    def test_invalid_corrupted_image_handled_safely(self) -> None:
        """Verify that a corrupted image file raises ValueError."""
        engine = YOLOInferenceEngine(
            model_path=self.model_path,
            mock_detector=self._mock_detector,
        )
        corrupted = Path(self.temp_dir) / "corrupted.jpg"
        corrupted.write_bytes(b"INVALID_IMAGE_PAYLOAD_GARBAGE")

        with self.assertRaises(ValueError):
            engine.infer(corrupted)

    def test_missing_model_file_handled_safely(self) -> None:
        """Verify that a missing model weights file raises FileNotFoundError on initialization."""
        missing_model = Path(self.temp_dir) / "non_existent_yolo.pt"

        with self.assertRaises(FileNotFoundError):
            YOLOInferenceEngine(model_path=missing_model)

    def test_empty_detections_handled_gracefully(self) -> None:
        """Verify that when no objects are detected, fallback defaults are assigned safely."""
        empty_detector = lambda path, conf: []
        engine = YOLOInferenceEngine(
            model_path=self.model_path,
            mock_detector=empty_detector,
        )

        result = engine.infer(self.image_path, record_mlflow=False)

        self.assertEqual(result.primary_label, "unclassified")
        self.assertEqual(result.confidence, 0.0)
        self.assertEqual(result.bbox, [0.0, 0.0, 0.0, 0.0])
        self.assertEqual(result.total_detections, 0)

    def test_inference_dict_serialization(self) -> None:
        """Verify that to_dict() outputs standard JSON-serializable structure."""
        engine = YOLOInferenceEngine(
            model_path=self.model_path,
            mock_detector=self._mock_detector,
        )
        result = engine.infer(self.image_path, record_mlflow=False)
        result_dict = result.to_dict()

        expected_keys = {
            "inference_id",
            "primary_label",
            "confidence",
            "bbox",
            "detections",
            "total_detections",
            "input_hash",
            "model_hash",
            "model_name",
            "image_path",
            "timestamp",
            "metadata",
        }
        self.assertTrue(expected_keys.issubset(result_dict.keys()))


if __name__ == "__main__":
    unittest.main()
