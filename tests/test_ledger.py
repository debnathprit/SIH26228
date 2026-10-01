"""Tests for tamper-evident hash chain ledger."""

from pathlib import Path
import sys
import unittest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from blockchain.ledger.hash_chain import (
    GENESIS_PREVIOUS_HASH,
    HashChainLedger,
    LedgerRecord,
)


class TestHashChainLedger(unittest.TestCase):
    """Test suite for the sequential hash chain ledger."""

    def test_ledger_initialization_with_genesis(self) -> None:
        """Verify that a ledger initializes with a valid genesis block."""
        ledger = HashChainLedger(auto_genesis=True)
        self.assertEqual(ledger.length, 1)

        genesis = ledger.records[0]
        self.assertEqual(genesis.index, 0)
        self.assertEqual(genesis.previous_hash, GENESIS_PREVIOUS_HASH)
        self.assertEqual(len(genesis.current_hash), 64)

        is_valid, error = ledger.verify_chain()
        self.assertTrue(is_valid)
        self.assertIsNone(error)

    def test_records_can_be_appended(self) -> None:
        """Verify appending records correctly links previous hashes and increments indexes."""
        ledger = HashChainLedger(auto_genesis=True)

        record1 = ledger.append_record(
            payload={"evidence_id": "ev-001", "prediction": "vehicle", "output_hash": "a" * 64}
        )
        self.assertEqual(record1.index, 1)
        self.assertEqual(record1.previous_hash, ledger.records[0].current_hash)
        self.assertEqual(ledger.length, 2)

        record2 = ledger.append_record(
            payload={"evidence_id": "ev-002", "prediction": "person", "output_hash": "b" * 64}
        )
        self.assertEqual(record2.index, 2)
        self.assertEqual(record2.previous_hash, record1.current_hash)
        self.assertEqual(ledger.length, 3)

    def test_valid_chain_verifies_successfully(self) -> None:
        """Verify that an untampered multi-record ledger passes verification."""
        ledger = HashChainLedger(auto_genesis=True)
        for i in range(5):
            ledger.append_record(payload={"run_id": f"run-{i}", "status": "VERIFIED"})

        is_valid, error = ledger.verify_chain()
        self.assertTrue(is_valid)
        self.assertIsNone(error)

    def test_modifying_a_record_causes_verification_to_fail(self) -> None:
        """Verify that altering a historical record's payload breaks integrity verification."""
        ledger = HashChainLedger(auto_genesis=True)
        ledger.append_record(payload={"prediction": "vehicle", "confidence": 0.98})
        ledger.append_record(payload={"prediction": "pedestrian", "confidence": 0.91})

        # Confirm valid before tampering
        is_valid, _ = ledger.verify_chain()
        self.assertTrue(is_valid)

        # Tamper with record 1 payload (e.g. change vehicle to plane)
        success = ledger.tamper_record_payload(
            index=1,
            tampered_payload={"prediction": "aircraft", "confidence": 0.98},
        )
        self.assertTrue(success)

        # Verification must now fail
        is_valid, error_msg = ledger.verify_chain()
        self.assertFalse(is_valid)
        self.assertIsNotNone(error_msg)
        self.assertIn("Tamper detected at index 1", error_msg)

    def test_serialization_and_deserialization(self) -> None:
        """Verify that exporting to list/dict and restoring retains full integrity."""
        ledger = HashChainLedger(auto_genesis=True)
        ledger.append_record(payload={"action": "model_verified", "model_hash": "f" * 64})

        exported = ledger.to_list()
        restored = HashChainLedger.from_list(exported)

        self.assertEqual(restored.length, ledger.length)
        is_valid, error = restored.verify_chain()
        self.assertTrue(is_valid)
        self.assertIsNone(error)


if __name__ == "__main__":
    unittest.main()
