"""Model Integrity Verifier.

Computes and verifies binary SHA-256 cryptographic digests for machine learning models
(.onnx, .pt, .pth, TorchScript, etc.) against expected reference signatures.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import hmac
from pathlib import Path
import sys
from typing import Any, Union

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.utils.crypto_utils import sha256_file


@dataclass
class ModelVerificationResult:
    """Structured result of a model integrity verification check."""

    model_name: str
    model_hash: str
    expected_hash: str
    status: str  # "MATCH" or "MISMATCH"
    model_path: str
    file_size_bytes: int
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert result to a standard dictionary."""
        return asdict(self)


def hash_model_file(model_path: Union[str, Path]) -> str:
    """Compute the binary SHA-256 cryptographic hash of a model file.

    Reuses chunked file hashing to efficiently process large weights.
    Raises FileNotFoundError if the file does not exist.
    """
    path = Path(model_path)
    if not path.is_file():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    return sha256_file(path)


def verify_model_integrity(
    model_path: Union[str, Path],
    expected_hash: str,
    model_name: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> ModelVerificationResult:
    """Verify the cryptographic integrity of a model file against an expected SHA-256 digest.

    Args:
        model_path: Path to the model file (.pt, .onnx, .pth, etc.)
        expected_hash: The reference SHA-256 hash expected for this model
        model_name: Optional human-readable model name (defaults to file stem)
        metadata: Optional dictionary with extra model info (framework, version, etc.)

    Returns:
        ModelVerificationResult with status "MATCH" or "MISMATCH".
    """
    path = Path(model_path)
    if not path.is_file():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    computed_hash = hash_model_file(path)
    file_size = path.stat().st_size
    resolved_name = model_name or path.name

    norm_computed = computed_hash.strip().lower()
    norm_expected = expected_hash.strip().lower()

    # Constant-time comparison to prevent timing side channels
    is_match = hmac.compare_digest(norm_computed, norm_expected)
    status = "MATCH" if is_match else "MISMATCH"

    return ModelVerificationResult(
        model_name=resolved_name,
        model_hash=computed_hash,
        expected_hash=expected_hash,
        status=status,
        model_path=str(path),
        file_size_bytes=file_size,
        metadata=metadata or {},
    )
