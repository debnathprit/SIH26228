"""Tamper-evident sequential hash chain ledger for Computer Vision Evidence Assurance.

Each record in the ledger cryptographically links to the previous record's hash.
Modifying any historical record breaks the hash chain and is immediately detected.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import hashlib
import json
from typing import Any


GENESIS_PREVIOUS_HASH = "0" * 64


def _canonicalize(data: Any) -> str:
    """Deterministic JSON serialization."""
    return json.dumps(
        data,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        default=str,
    )


def calculate_record_hash(
    index: int,
    timestamp: str,
    previous_hash: str,
    payload: Any,
) -> str:
    """Calculate the deterministic SHA-256 hash for a ledger record.

    The hash covers the record's index, previous hash, timestamp, and payload.
    """
    record_content = {
        "index": index,
        "payload": payload,
        "previous_hash": previous_hash,
        "timestamp": timestamp,
    }
    canonical_repr = _canonicalize(record_content)
    return hashlib.sha256(canonical_repr.encode("utf-8")).hexdigest()


@dataclass
class LedgerRecord:
    """Represents an individual entry in the sequential hash chain."""

    index: int
    timestamp: str
    previous_hash: str
    payload: Any
    current_hash: str

    def to_dict(self) -> dict[str, Any]:
        """Convert record to a standard dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> LedgerRecord:
        """Create a LedgerRecord instance from a dictionary."""
        return cls(
            index=data["index"],
            timestamp=data["timestamp"],
            previous_hash=data["previous_hash"],
            payload=data["payload"],
            current_hash=data["current_hash"],
        )


class HashChainLedger:
    """Sequential tamper-evident hash chain ledger."""

    def __init__(self, auto_genesis: bool = True) -> None:
        self.records: list[LedgerRecord] = []
        if auto_genesis:
            self._create_genesis_record()

    def _create_genesis_record(self) -> LedgerRecord:
        """Create the initial genesis record for the chain."""
        timestamp = datetime.now(timezone.utc).isoformat()
        payload = {
            "type": "GENESIS",
            "description": "Trustworthy Computer Vision Assurance Ledger Initialized",
        }
        genesis_hash = calculate_record_hash(
            index=0,
            timestamp=timestamp,
            previous_hash=GENESIS_PREVIOUS_HASH,
            payload=payload,
        )
        record = LedgerRecord(
            index=0,
            timestamp=timestamp,
            previous_hash=GENESIS_PREVIOUS_HASH,
            payload=payload,
            current_hash=genesis_hash,
        )
        self.records.append(record)
        return record

    @property
    def length(self) -> int:
        """Return the number of records in the ledger."""
        return len(self.records)

    def get_last_record(self) -> LedgerRecord | None:
        """Return the most recent record or None if ledger is empty."""
        return self.records[-1] if self.records else None

    def append_record(
        self,
        payload: Any,
        timestamp: str | None = None,
    ) -> LedgerRecord:
        """Append a new record cryptographically linked to the previous record."""
        if not self.records:
            # If empty and no genesis, previous hash is default genesis hash
            prev_hash = GENESIS_PREVIOUS_HASH
            new_index = 0
        else:
            prev_record = self.records[-1]
            prev_hash = prev_record.current_hash
            new_index = len(self.records)

        record_timestamp = timestamp or datetime.now(timezone.utc).isoformat()
        record_hash = calculate_record_hash(
            index=new_index,
            timestamp=record_timestamp,
            previous_hash=prev_hash,
            payload=payload,
        )

        record = LedgerRecord(
            index=new_index,
            timestamp=record_timestamp,
            previous_hash=prev_hash,
            payload=payload,
            current_hash=record_hash,
        )
        self.records.append(record)
        return record

    def calculate_expected_hash(self, record: LedgerRecord) -> str:
        """Calculate what the hash of an existing record should be."""
        return calculate_record_hash(
            index=record.index,
            timestamp=record.timestamp,
            previous_hash=record.previous_hash,
            payload=record.payload,
        )

    def verify_chain(self) -> tuple[bool, str | None]:
        """Verify the integrity of the complete hash chain.

        Returns:
            (True, None) if the chain is fully valid.
            (False, error_message) describing the exact point and type of tampering detected.
        """
        if not self.records:
            return True, None

        for i, record in enumerate(self.records):
            # 1. Verify index sequence
            if record.index != i:
                return (
                    False,
                    f"Index sequence violation at position {i}: expected index {i}, found {record.index}",
                )

            # 2. Verify previous_hash linkage
            if i == 0:
                if record.previous_hash != GENESIS_PREVIOUS_HASH:
                    return (
                        False,
                        f"Genesis block previous_hash invalid: expected {GENESIS_PREVIOUS_HASH}, got {record.previous_hash}",
                    )
            else:
                expected_prev = self.records[i - 1].current_hash
                if record.previous_hash != expected_prev:
                    return (
                        False,
                        f"Chain broken at index {i}: record previous_hash does not match preceding record's current_hash",
                    )

            # 3. Verify record cryptographic hash
            expected_current_hash = self.calculate_expected_hash(record)
            if record.current_hash != expected_current_hash:
                return (
                    False,
                    f"Tamper detected at index {i}: current_hash mismatch. Recorded '{record.current_hash}', computed '{expected_current_hash}'",
                )

        return True, None

    def tamper_record_payload(self, index: int, tampered_payload: Any) -> bool:
        """Simulate tampering by altering an existing record's payload without updating its hash."""
        if 0 <= index < len(self.records):
            self.records[index].payload = tampered_payload
            return True
        return False

    def to_list(self) -> list[dict[str, Any]]:
        """Export ledger records as a list of dictionaries."""
        return [record.to_dict() for record in self.records]

    @classmethod
    def from_list(cls, records_data: list[dict[str, Any]]) -> HashChainLedger:
        """Reconstruct a ledger from serialized records."""
        ledger = cls(auto_genesis=False)
        ledger.records = [LedgerRecord.from_dict(item) for item in records_data]
        return ledger
