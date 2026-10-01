"""MLflow experiment and model tracking integration for Model Integrity.

Logs model integrity verification runs, parameters, hashes, and metrics
to a local offline MLflow tracking store (SQLite backend).
"""

from __future__ import annotations

import os
from pathlib import Path
import sys
from typing import Any

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.model_integrity.verifier import ModelVerificationResult

# Configure environment for offline local execution
os.environ["MLFLOW_ALLOW_FILE_STORE"] = "true"
os.environ["MLFLOW_DISABLE_AGENT_HINT"] = "1"

try:
    import mlflow
    MLFLOW_AVAILABLE = True
except ImportError:
    mlflow = None  # type: ignore
    MLFLOW_AVAILABLE = False


DEFAULT_EXPERIMENT_NAME = "Model_Integrity_Assurance"


def get_default_tracking_uri() -> str:
    """Return a standard SQLite tracking URI pointing to local mlflow.db."""
    db_path = (PROJECT_ROOT / "mlflow.db").resolve().as_posix()
    return f"sqlite:///{db_path}"


def init_mlflow_tracking(
    tracking_uri: str | None = None,
    experiment_name: str = DEFAULT_EXPERIMENT_NAME,
) -> None:
    """Initialize local MLflow tracking environment."""
    if not MLFLOW_AVAILABLE:
        raise RuntimeError("MLflow is not installed in the current Python environment.")

    resolved_uri = tracking_uri or get_default_tracking_uri()
    mlflow.set_tracking_uri(resolved_uri)
    mlflow.set_experiment(experiment_name)


def record_verification_run(
    result: ModelVerificationResult,
    experiment_name: str = DEFAULT_EXPERIMENT_NAME,
    tracking_uri: str | None = None,
    run_name: str | None = None,
) -> dict[str, Any]:
    """Record a model verification event in local MLflow tracking.

    Logs:
        Parameters: model_name, expected_hash, model_path, metadata
        Metrics: integrity_passed (1.0 for MATCH, 0.0 for MISMATCH), file_size_bytes
        Tags: verification_status, model_hash, timestamp

    Returns:
        Dictionary with run_id, experiment_id, tracking_uri, and status.
    """
    if not MLFLOW_AVAILABLE:
        raise RuntimeError("MLflow is not installed in the current Python environment.")

    init_mlflow_tracking(tracking_uri=tracking_uri, experiment_name=experiment_name)

    clean_run_name = run_name or f"verify_{result.model_name}"

    with mlflow.start_run(run_name=clean_run_name) as run:
        # 1. Log model identification parameters
        mlflow.log_param("model_name", result.model_name)
        mlflow.log_param("expected_hash", result.expected_hash)
        mlflow.log_param("model_path", result.model_path)
        for meta_k, meta_v in result.metadata.items():
            mlflow.log_param(f"meta_{meta_k}", str(meta_v))

        # 2. Log numerical metrics
        integrity_passed = 1.0 if result.status == "MATCH" else 0.0
        mlflow.log_metric("integrity_passed", integrity_passed)
        mlflow.log_metric("file_size_bytes", float(result.file_size_bytes))

        # 3. Log diagnostic tags
        mlflow.set_tag("verification_status", result.status)
        mlflow.set_tag("model_hash", result.model_hash)
        mlflow.set_tag("verified_at", result.timestamp)
        mlflow.set_tag("pipeline_stage", "model_integrity_assurance")

        run_id = run.info.run_id
        experiment_id = run.info.experiment_id

    return {
        "run_id": run_id,
        "experiment_id": experiment_id,
        "tracking_uri": mlflow.get_tracking_uri(),
        "status": result.status,
        "model_name": result.model_name,
        "model_hash": result.model_hash,
    }
