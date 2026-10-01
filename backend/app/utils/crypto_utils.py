"""Cryptographic hashing utilities for Trustworthy Computer Vision Assurance.

Provides deterministic SHA-256 calculation for:
- Raw byte buffers
- Strings
- Canonical JSON objects
- Files on disk (chunked for memory efficiency)
- Standardized evidence payloads
"""

from __future__ import annotations

import hashlib
import hmac
import json
from pathlib import Path
from typing import Any, Union


def sha256_bytes(data: bytes) -> str:
    """Compute the SHA-256 hex digest of raw bytes."""
    if not isinstance(data, (bytes, bytearray)):
        raise TypeError(f"Expected bytes or bytearray, got {type(data).__name__}")
    return hashlib.sha256(data).hexdigest()


def sha256_str(data: str, encoding: str = "utf-8") -> str:
    """Compute the SHA-256 hex digest of a string using the specified encoding."""
    if not isinstance(data, str):
        raise TypeError(f"Expected str, got {type(data).__name__}")
    return sha256_bytes(data.encode(encoding))


def canonicalize_json(data: Any) -> str:
    """Return a deterministic, canonical JSON representation of the input.

    Uses sort_keys=True and compact separators (',', ':') to ensure that
    identical logical structures produce identical string representations
    regardless of key insertion order or formatting whitespace.
    """
    return json.dumps(
        data,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        default=str,
    )


def sha256_json(data: Any) -> str:
    """Compute the SHA-256 hex digest of a canonicalized JSON object."""
    canonical = canonicalize_json(data)
    return sha256_str(canonical)


def sha256_file(filepath: Union[str, Path], chunk_size: int = 65536) -> str:
    """Compute the SHA-256 hex digest of a file in chunks to handle large files efficiently."""
    path = Path(filepath)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {filepath}")

    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(chunk_size):
            hasher.update(chunk)
    return hasher.hexdigest()


def generate_evidence_hash(
    input_hash: str,
    model_hash: str,
    prediction_data: Any,
    timestamp: str,
    run_id: str | None = None,
) -> str:
    """Generate a deterministic cryptographic output hash for an inference record.

    Evidence formula:
      SHA-256( canonical_json({
          'input_hash': input_hash,
          'model_hash': model_hash,
          'prediction': prediction_data,
          'timestamp': timestamp,
          'run_id': run_id (optional)
      }) )
    """
    evidence_payload: dict[str, Any] = {
        "input_hash": input_hash,
        "model_hash": model_hash,
        "prediction": prediction_data,
        "timestamp": timestamp,
    }
    if run_id is not None:
        evidence_payload["run_id"] = run_id

    return sha256_json(evidence_payload)


def verify_hash(data: Any, expected_hash: str, is_json: bool = True) -> bool:
    """Verify if the SHA-256 hash of data matches the expected hash using constant-time comparison."""
    if not isinstance(expected_hash, str):
        return False

    if is_json:
        computed = sha256_json(data)
    elif isinstance(data, (bytes, bytearray)):
        computed = sha256_bytes(data)
    elif isinstance(data, str):
        computed = sha256_str(data)
    else:
        raise TypeError(f"Unsupported data type for hash verification: {type(data).__name__}")

    return hmac.compare_digest(computed.lower(), expected_hash.strip().lower())
