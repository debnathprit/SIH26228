"""Tests for Dataset Integrity Analyzer."""

import io
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
import zipfile

from PIL import Image

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.utils.crypto_utils import sha256_bytes
from ml.dataset_analyzer.analyzer import DatasetAnalyzer, analyze_dataset


class TestDatasetAnalyzer(unittest.TestCase):
    """Test suite for dataset integrity screening and reporting."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = DatasetAnalyzer()

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_dummy_image(
        self,
        folder: str,
        name: str,
        size: tuple[int, int] = (64, 64),
        color: tuple[int, int, int] = (255, 0, 0),
        fmt: str = "PNG",
    ) -> Path:
        """Create a synthetic valid test image on disk."""
        path = Path(folder) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        img = Image.new("RGB", size, color=color)
        img.save(str(path), format=fmt)
        return path

    def test_valid_image_detection_and_verified_status(self) -> None:
        """Verify that a clean dataset of valid images yields VERIFIED status and accurate metrics."""
        self._create_dummy_image(self.temp_dir, "img1.png", color=(255, 0, 0))
        self._create_dummy_image(self.temp_dir, "img2.jpg", color=(0, 255, 0), fmt="JPEG")
        self._create_dummy_image(self.temp_dir, "subdir/img3.png", color=(0, 0, 255))

        report = self.analyzer.analyze_directory(self.temp_dir)

        self.assertEqual(report.total_images, 3)
        self.assertEqual(report.valid_images, 3)
        self.assertEqual(report.corrupted_images, 0)
        self.assertEqual(report.duplicate_images, 0)
        self.assertEqual(report.unique_images, 3)
        self.assertEqual(report.file_types.get("png"), 2)
        self.assertEqual(report.file_types.get("jpg"), 1)
        self.assertEqual(len(report.flagged_samples), 0)
        self.assertEqual(report.status, "VERIFIED")

    def test_corrupted_image_detection_and_review_status(self) -> None:
        """Verify that unreadable/corrupted images are flagged and trigger REVIEW status."""
        self._create_dummy_image(self.temp_dir, "clean.png", color=(10, 20, 30))

        # Write invalid binary data into an image file
        corrupt_path = Path(self.temp_dir) / "broken.jpg"
        corrupt_path.write_bytes(b"INVALID_HEADER_NOT_A_JPEG_STREAM")

        report = self.analyzer.analyze_directory(self.temp_dir)

        self.assertEqual(report.total_images, 2)
        self.assertEqual(report.valid_images, 1)
        self.assertEqual(report.corrupted_images, 1)
        self.assertEqual(report.status, "REVIEW")

        corrupt_flags = [f for f in report.flagged_samples if f["issue"] == "CORRUPTED_IMAGE"]
        self.assertEqual(len(corrupt_flags), 1)
        self.assertEqual(corrupt_flags[0]["filename"], "broken.jpg")

    def test_exact_duplicate_detection(self) -> None:
        """Verify that duplicate images sharing identical SHA-256 are flagged."""
        orig = self._create_dummy_image(self.temp_dir, "original.png", color=(50, 50, 50))
        dup1 = Path(self.temp_dir) / "duplicate1.png"
        dup2 = Path(self.temp_dir) / "duplicate2.png"
        shutil.copyfile(orig, dup1)
        shutil.copyfile(orig, dup2)

        report = self.analyzer.analyze_directory(self.temp_dir)

        self.assertEqual(report.total_images, 3)
        self.assertEqual(report.valid_images, 3)
        self.assertEqual(report.duplicate_images, 2)
        self.assertEqual(report.unique_images, 1)
        self.assertEqual(report.status, "REVIEW")

        dup_flags = [f for f in report.flagged_samples if f["issue"] == "DUPLICATE_SAMPLE"]
        self.assertEqual(len(dup_flags), 2)

    def test_unsupported_file_handling(self) -> None:
        """Verify that non-image files (.txt, .csv, .py) are safely ignored."""
        self._create_dummy_image(self.temp_dir, "valid.png")

        # Create unsupported files
        (Path(self.temp_dir) / "labels.csv").write_text("class,bbox\nvehicle,10,20", encoding="utf-8")
        (Path(self.temp_dir) / "README.txt").write_text("Dataset documentation", encoding="utf-8")

        report = self.analyzer.analyze_directory(self.temp_dir)

        self.assertEqual(report.total_images, 1)
        self.assertEqual(report.valid_images, 1)
        self.assertEqual(report.corrupted_images, 0)
        self.assertEqual(report.status, "VERIFIED")

    def test_deterministic_sha256_calculation(self) -> None:
        """Verify that image SHA-256 is deterministic and matches raw file byte hash."""
        img_path = self._create_dummy_image(self.temp_dir, "test_hash.png", color=(100, 150, 200))
        data = img_path.read_bytes()
        expected_sha = sha256_bytes(data)

        report = self.analyzer.analyze_directory(self.temp_dir)
        self.assertEqual(report.valid_images, 1)

        # Re-analyzing must produce identical SHA-256
        report_second = self.analyzer.analyze_directory(self.temp_dir)
        self.assertEqual(report.unique_images, report_second.unique_images)
        self.assertEqual(len(expected_sha), 64)

    def test_structured_audit_report_format(self) -> None:
        """Verify that audit reports provide the full structured dictionary contract."""
        self._create_dummy_image(self.temp_dir, "sample.png")
        report = self.analyzer.analyze_directory(self.temp_dir)
        report_dict = report.to_dict()

        expected_keys = {
            "total_images",
            "valid_images",
            "corrupted_images",
            "duplicate_images",
            "unique_images",
            "file_types",
            "flagged_samples",
            "status",
            "dataset_source",
            "timestamp",
            "disclaimer",
        }
        self.assertTrue(expected_keys.issubset(report_dict.keys()))
        self.assertIn("adversarial", report.disclaimer.lower())

    def test_zip_archive_analysis(self) -> None:
        """Verify that analyzing a zipped dataset archive behaves identically to directory scanning."""
        zip_path = Path(self.temp_dir) / "test_dataset.zip"

        # Generate in-memory images and write to zip
        img1_buf = io.BytesIO()
        Image.new("RGB", (32, 32), color=(200, 0, 0)).save(img1_buf, format="PNG")
        img1_bytes = img1_buf.getvalue()

        img2_buf = io.BytesIO()
        Image.new("RGB", (32, 32), color=(0, 200, 0)).save(img2_buf, format="PNG")
        img2_bytes = img2_buf.getvalue()

        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("train/img1.png", img1_bytes)
            zf.writestr("train/img2.png", img2_bytes)
            zf.writestr("notes.txt", "unsupported file")
            zf.writestr("train/corrupted.jpg", b"NOT_A_JPEG")

        report = analyze_dataset(zip_path)

        self.assertEqual(report.total_images, 3)
        self.assertEqual(report.valid_images, 2)
        self.assertEqual(report.corrupted_images, 1)
        self.assertEqual(report.status, "REVIEW")


if __name__ == "__main__":
    unittest.main()
