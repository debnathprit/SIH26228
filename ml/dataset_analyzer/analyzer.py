"""Dataset Integrity Analyzer for Computer Vision Pipelines.

Screens dataset image folders or ZIP archives for:
- File unreadability and corruption
- Exact duplicate images via SHA-256
- Extension/format distributions
- Flagged samples requiring manual or automated review
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import io
from pathlib import Path
import sys
from typing import Any, Union
import zipfile

from PIL import Image

# Ensure project root is in sys.path to access crypto_utils
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from backend.app.utils.crypto_utils import sha256_bytes
except ImportError:
    import hashlib

    def sha256_bytes(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()


SUPPORTED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp",
    ".tiff",
    ".tif",
}

DISCLAIMER_TEXT = (
    "Dataset integrity screening verifies file decodability, format validity, "
    "and duplicate detection. It does not definitively prove the absence of "
    "adversarial examples, subtle poisoning, or model backdoors."
)


@dataclass
class FlaggedSample:
    """Details for a sample flagged during integrity screening."""

    filename: str
    issue: str
    sha256: str | None = None
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ImageMetadata:
    """Metadata extracted from a valid image."""

    filename: str
    extension: str
    width: int
    height: int
    format: str
    sha256: str
    size_bytes: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class DatasetAuditReport:
    """Structured audit report for dataset integrity screening."""

    total_images: int
    valid_images: int
    corrupted_images: int
    duplicate_images: int
    unique_images: int
    file_types: dict[str, int]
    flagged_samples: list[dict[str, Any]]
    status: str
    dataset_source: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    disclaimer: str = DISCLAIMER_TEXT

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class DatasetAnalyzer:
    """Analyzes image datasets from disk directories or ZIP archives."""

    def __init__(self, supported_extensions: set[str] | None = None) -> None:
        self.supported_extensions = (
            {ext.lower() for ext in supported_extensions}
            if supported_extensions is not None
            else SUPPORTED_IMAGE_EXTENSIONS
        )

    def is_supported_image(self, filename: str) -> bool:
        """Check if a file has a supported image extension."""
        return Path(filename).suffix.lower() in self.supported_extensions

    def _process_image_stream(
        self,
        name: str,
        data: bytes,
        seen_hashes: dict[str, str],
        valid_metadata: list[ImageMetadata],
        flagged: list[FlaggedSample],
        file_types: dict[str, int],
    ) -> None:
        """Inspect a single image payload in memory."""
        file_ext = Path(name).suffix.lower().lstrip(".")
        img_hash = sha256_bytes(data)

        # 1. Check if file is corrupted / unreadable
        try:
            # First pass: verify structure without loading full image
            with Image.open(io.BytesIO(data)) as img:
                img.verify()

            # Second pass: read dimensions and format
            with Image.open(io.BytesIO(data)) as img:
                width, height = img.size
                img_format = img.format or file_ext.upper()

        except Exception as exc:
            flagged.append(
                FlaggedSample(
                    filename=name,
                    issue="CORRUPTED_IMAGE",
                    sha256=img_hash,
                    details={
                        "error_type": type(exc).__name__,
                        "error_message": str(exc),
                        "size_bytes": len(data),
                    },
                )
            )
            return

        # 2. Check for exact duplicate via SHA-256
        if img_hash in seen_hashes:
            original_file = seen_hashes[img_hash]
            flagged.append(
                FlaggedSample(
                    filename=name,
                    issue="DUPLICATE_SAMPLE",
                    sha256=img_hash,
                    details={
                        "duplicate_of": original_file,
                        "width": width,
                        "height": height,
                        "format": img_format,
                    },
                )
            )
        else:
            seen_hashes[img_hash] = name

        # Valid image record
        valid_metadata.append(
            ImageMetadata(
                filename=name,
                extension=file_ext,
                width=width,
                height=height,
                format=img_format,
                sha256=img_hash,
                size_bytes=len(data),
            )
        )
        file_types[file_ext] = file_types.get(file_ext, 0) + 1

    def analyze_directory(self, dir_path: Union[str, Path]) -> DatasetAuditReport:
        """Scan and analyze an image directory recursively."""
        path = Path(dir_path)
        if not path.is_dir():
            raise FileNotFoundError(f"Dataset directory not found: {dir_path}")

        seen_hashes: dict[str, str] = {}
        valid_metadata: list[ImageMetadata] = []
        flagged: list[FlaggedSample] = []
        file_types: dict[str, int] = {}
        candidate_count = 0

        # Traverse directory recursively
        for file_path in sorted(path.rglob("*")):
            if not file_path.is_file():
                continue
            if not self.is_supported_image(file_path.name):
                # Safely skip unsupported file types (e.g. .txt, .csv, metadata)
                continue

            candidate_count += 1
            try:
                data = file_path.read_bytes()
            except Exception as read_exc:
                flagged.append(
                    FlaggedSample(
                        filename=file_path.name,
                        issue="FILE_READ_ERROR",
                        details={"error_message": str(read_exc)},
                    )
                )
                continue

            rel_name = str(file_path.relative_to(path))
            self._process_image_stream(
                name=rel_name,
                data=data,
                seen_hashes=seen_hashes,
                valid_metadata=valid_metadata,
                flagged=flagged,
                file_types=file_types,
            )

        return self._build_report(
            source=str(path),
            candidate_count=candidate_count,
            seen_hashes=seen_hashes,
            valid_metadata=valid_metadata,
            flagged=flagged,
            file_types=file_types,
        )

    def analyze_zip(self, zip_path: Union[str, Path]) -> DatasetAuditReport:
        """Scan and analyze a ZIP archive containing images."""
        path = Path(zip_path)
        if not path.is_file():
            raise FileNotFoundError(f"ZIP archive not found: {zip_path}")

        seen_hashes: dict[str, str] = {}
        valid_metadata: list[ImageMetadata] = []
        flagged: list[FlaggedSample] = []
        file_types: dict[str, int] = {}
        candidate_count = 0

        try:
            with zipfile.ZipFile(path, "r") as archive:
                for file_info in archive.infolist():
                    if file_info.is_dir():
                        continue
                    if not self.is_supported_image(file_info.filename):
                        continue

                    candidate_count += 1
                    try:
                        data = archive.read(file_info.filename)
                    except Exception as zip_err:
                        flagged.append(
                            FlaggedSample(
                                filename=file_info.filename,
                                issue="ARCHIVE_READ_ERROR",
                                details={"error_message": str(zip_err)},
                            )
                        )
                        continue

                    self._process_image_stream(
                        name=file_info.filename,
                        data=data,
                        seen_hashes=seen_hashes,
                        valid_metadata=valid_metadata,
                        flagged=flagged,
                        file_types=file_types,
                    )
        except zipfile.BadZipFile as exc:
            raise ValueError(f"Corrupted or invalid ZIP archive: {zip_path}") from exc

        return self._build_report(
            source=str(path),
            candidate_count=candidate_count,
            seen_hashes=seen_hashes,
            valid_metadata=valid_metadata,
            flagged=flagged,
            file_types=file_types,
        )

    def analyze(self, target: Union[str, Path]) -> DatasetAuditReport:
        """Analyze a dataset from either a directory path or a ZIP archive."""
        path = Path(target)
        if not path.exists():
            raise FileNotFoundError(f"Target dataset path does not exist: {target}")

        if path.is_dir():
            return self.analyze_directory(path)
        if path.is_file() and path.suffix.lower() == ".zip":
            return self.analyze_zip(path)

        raise ValueError(
            f"Unsupported target '{target}'. Must be a directory or a .zip archive."
        )

    def _build_report(
        self,
        source: str,
        candidate_count: int,
        seen_hashes: dict[str, str],
        valid_metadata: list[ImageMetadata],
        flagged: list[FlaggedSample],
        file_types: dict[str, int],
    ) -> DatasetAuditReport:
        """Synthesize metrics and assign VERIFIED or REVIEW status."""
        corrupted_count = sum(1 for s in flagged if s.issue in ("CORRUPTED_IMAGE", "FILE_READ_ERROR", "ARCHIVE_READ_ERROR"))
        duplicate_count = sum(1 for s in flagged if s.issue == "DUPLICATE_SAMPLE")
        valid_count = len(valid_metadata)
        unique_count = len(seen_hashes)

        # Status logic:
        # VERIFIED if candidates exist, all are valid, zero corrupted, zero duplicates, and zero flags.
        # REVIEW if any corrupted or duplicate images or empty dataset.
        if candidate_count > 0 and corrupted_count == 0 and duplicate_count == 0 and len(flagged) == 0:
            status = "VERIFIED"
        else:
            status = "REVIEW"

        return DatasetAuditReport(
            total_images=candidate_count,
            valid_images=valid_count,
            corrupted_images=corrupted_count,
            duplicate_images=duplicate_count,
            unique_images=unique_count,
            file_types=file_types,
            flagged_samples=[s.to_dict() for s in flagged],
            status=status,
            dataset_source=source,
        )


def analyze_dataset(target_path: Union[str, Path]) -> DatasetAuditReport:
    """Convenience helper to analyze a dataset path."""
    analyzer = DatasetAnalyzer()
    return analyzer.analyze(target_path)
