# Verification Report: Active Distribution Shift & Anomaly Evaluation Endpoint

**Project:** SIH Problem Statement 26228 — Trusted Computer Vision Integrity Assurance for Data, Models and Inference Outputs in Multi-Contributor Pipelines  
**Endpoint:** `POST /api/v1/assurance/distribution-shift/evaluate`  
**Branch:** `pritam`  
**Verification Date:** 2026-10-02  

---

## 1. Files Created & Modified

| File | Status | Description |
| :--- | :--- | :--- |
| `backend/app/models/schemas.py` | Modified | Added `ShiftDimensionData` and `DistributionShiftEvaluationData` Pydantic models following camelCase conventions and project standard `APIResponseEnvelope`. |
| `backend/app/services/assurance_service.py` | Modified | Added `evaluate_active_distribution_shift()` method in `AssuranceService` delegating to `DistributionShiftEvaluator` with `display_target` handling. |
| `backend/app/api/routes_assurance.py` | Modified | Implemented `POST /assurance/distribution-shift/evaluate` route with streaming upload, security validations, size bounds, and error handling. |
| `ml/distribution_shift/detector.py` | Modified | Added `ledger_record_index` tracking to `DistributionShiftReport` and `display_target` parameter to bind logical filenames to evidence digests. |
| `tests/test_api_distribution_shift.py` | Created | Added 10 end-to-end integration tests validating uploads, drift scenarios, validation rejections, ledger immutability, and tamper detection. |

---

## 2. Endpoint Request Format

### Specification
- **Method:** `POST`
- **Path:** `/api/v1/assurance/distribution-shift/evaluate`
- **Content-Type:** `multipart/form-data`
- **Authentication:** Not required (internal/evaluator endpoint)

### Parameters
| Name | Type | Source | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `file` | Binary | Form-Data | Yes | Operational query image (`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.tiff`, `.tif`). Maximum allowed size: **10 MB**. |
| `reference_dataset` | String | Form-Data | No | Path or identifier for reference dataset baseline. Defaults to `data/sample`. |

### Example cURL Command
```bash
curl -X POST "http://localhost:8000/api/v1/assurance/distribution-shift/evaluate" \
  -H "Accept: application/json" \
  -F "file=@data/sample/sample_01.png" \
  -F "reference_dataset=data/sample"
```

---

## 3. Example Successful Response

### HTTP 200 OK (In-Distribution Query)
```json
{
  "status": "success",
  "data": {
    "status": "VERIFIED",
    "classification": "IN-DISTRIBUTION",
    "overallDriftScore": 0.0,
    "overallSeverity": "low",
    "threshold": 0.15,
    "unresolvedFlags": 0,
    "evidenceAvailable": true,
    "evidenceHash": "893c8d1bb95eef7253509b23b53fba9ca9ae6dfdcfd6e04746f3dc8693895bd9",
    "ledgerRecordIndex": 3,
    "referenceDataset": "data/sample",
    "referenceFileCount": 3,
    "queryTarget": "sample_01.png",
    "assessmentTimestamp": "2026-10-02T04:31:24.123456+00:00",
    "dimensions": [
      {
        "dimension": "Illumination",
        "metric": "Wasserstein-1 (mean luminance)",
        "shiftValue": 0.0,
        "status": "PASS",
        "note": "Illumination consistent with reference baseline."
      },
      {
        "dimension": "Contrast",
        "metric": "Relative contrast ratio delta",
        "shiftValue": 0.0,
        "status": "PASS",
        "note": "Contrast levels within expected tolerance."
      },
      {
        "dimension": "Color Spectrum",
        "metric": "Wasserstein-1 (color distribution)",
        "shiftValue": 0.0,
        "status": "PASS",
        "note": "Color distribution matches training/reference baseline."
      },
      {
        "dimension": "Spatial Sharpness",
        "metric": "Relative blur/sharpness ratio delta",
        "shiftValue": 0.0,
        "status": "PASS",
        "note": "Image sharpness and blur variance within normal bounds."
      }
    ],
    "explanation": "No significant distribution shift detected across evaluated visual dimensions."
  },
  "error": null,
  "timestamp": "2026-10-02T04:31:24.125000+00:00"
}
```

---

## 4. Example Error Responses

### A. Missing File Upload (`HTTP 400 Bad Request`)
```json
{
  "status": "error",
  "data": null,
  "error": "Missing required image file upload.",
  "timestamp": "2026-10-02T04:31:25.000000+00:00"
}
```

### B. Unsupported File Extension (`HTTP 400 Bad Request`)
```json
{
  "status": "error",
  "data": null,
  "error": "Unsupported image extension '.sh'. Allowed: ['.bmp', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp']",
  "timestamp": "2026-10-02T04:31:25.000000+00:00"
}
```

### C. Corrupt / Non-Image Data (`HTTP 400 Bad Request`)
```json
{
  "status": "error",
  "data": null,
  "error": "Uploaded file is corrupt or not a valid readable image.",
  "timestamp": "2026-10-02T04:31:25.000000+00:00"
}
```

### D. File Exceeds Size Cap (`HTTP 413 Payload Too Large`)
```json
{
  "status": "error",
  "data": null,
  "error": "Uploaded file exceeds maximum limit of 10 MB.",
  "timestamp": "2026-10-02T04:31:25.000000+00:00"
}
```

### E. Oversized Image Dimensions (`HTTP 400 Bad Request`)
```json
{
  "status": "error",
  "data": null,
  "error": "Image dimensions (12000x9000) exceed maximum allowed dimension of 8192x8192.",
  "timestamp": "2026-10-02T04:31:25.000000+00:00"
}
```

---

## 5. Test Suite Results

### Endpoint-Specific Tests (`tests/test_api_distribution_shift.py`)
```text
Ran 10 tests in 1.458s
OK
```

1. `test_valid_in_distribution_image_upload`: **PASS** (HTTP 200, status=VERIFIED, classification=IN-DISTRIBUTION, ledger count +1, chain valid)
2. `test_operational_drift_image_upload`: **PASS** (HTTP 200, status=REVIEW, classification=OPERATIONAL DRIFT / OUT-OF-DISTRIBUTION)
3. `test_corrupt_non_image_upload_rejected`: **PASS** (HTTP 400, structured envelope, 0 ledger records added)
4. `test_unsupported_extension_upload_rejected`: **PASS** (HTTP 400, extension rejection, 0 ledger records added)
5. `test_oversized_upload_rejected`: **PASS** (HTTP 413, streaming cutoff at 10 MB, 0 ledger records added)
6. `test_missing_file_payload`: **PASS** (HTTP 400, clean error envelope, 0 ledger records added)
7. `test_temporary_file_cleanup_after_request`: **PASS** (Zero temporary files leaked in system temp directory)
8. `test_passive_summary_regression_and_ledger_immutability`: **PASS** (Passive GET /assurance/summary unchanged, 8 evidence count, 0 ledger additions)
9. `test_tamper_evidence_verification`: **PASS** (Cryptographic SHA-256 evidence payload verified; tamper modifications rejected)
10. `test_existing_system_endpoints_unaffected`: **PASS** (`/health` and `/system/overview` respond 200 OK)

---

## 6. Total Project Test Count

The complete test suite runs and passes cleanly:
```text
Ran 67 tests in 6.130s
OK
```
- **Pre-existing tests:** 42 passed
- **Distribution shift evaluator tests:** 15 passed
- **Active endpoint integration tests:** 10 passed
- **Total passing tests:** **67 / 67**

---

## 7. Confirmation: Existing APIs Unchanged

- `GET /api/v1/health` → **200 OK** (Status: `ok`)
- `GET /api/v1/system/overview` → **200 OK** (Project: `Trusted Computer Vision Assurance`)
- `GET /api/v1/assurance/summary` → **200 OK** (Global disposition: `REVIEW`, evidence count: 8, 4/5 `VERIFIED`, 1/5 `UNAVAILABLE`, flags: 0)

No routes, field names, response formats, or schema definitions of existing endpoints were modified.

---

## 8. Confirmation: Frontend Untouched

The frontend repository directory remains completely untouched:
```bash
git status -- frontend/
# (empty - no modifications)
```

---

## 9. Confirmation: Temporary Files Cleaned

Uploaded bytes are spooled via `tempfile.NamedTemporaryFile(delete=False)`. A strict `try ... finally: tmp_path.unlink(missing_ok=True)` block guarantees that even on uncaught exceptions or early aborts, no uploaded image file persists on disk. Test `test_temporary_file_cleanup_after_request` confirms zero leaked files in the system temporary directory.

---

## 10. Confirmation: Passive Summary Immutability

Passive calls to `GET /api/v1/assurance/summary` do **not** trigger model inference, active distribution shift detection, or ledger record append operations. The ledger height before and after passive calls remains completely invariant. The distribution shift pillar in the passive summary continues to honestly report `UNAVAILABLE` when no operational query image is supplied.

---

## 11. Security Defenses & Design Decisions

1. **Path Traversal Protection:** The route uses `Path(file.filename).name` to strip directory components and never writes directly using client-specified paths.
2. **Chunked Streaming & Size Cap:** Uploads stream in 64 KB chunks up to an absolute limit of 10 MB. Once exceeded, writing terminates immediately and returns `HTTP 413`, preventing memory exhaustion or disk-filling DoS attacks.
3. **Decodability & Decompression Bomb Protection:** Files are opened and verified using Pillow's `img.verify()`, and dimensions are capped at $8192 \times 8192$ pixels.
4. **Information Leakage Prevention:** Internal filesystem paths (e.g. system temporary folder paths) are never exposed in client error envelopes.
5. **Cryptographic Logical Filename Binding:** The evaluation engine accepts `display_target`, binding the logical filename (e.g. `sample_01.png`) into the signed evidence payload rather than the volatile server temporary path (`tmpXXXXX.png`). This ensures reproducible, portable cryptographic audits across independent nodes.

---

## 12. Git Status

```text
On branch pritam
Your branch is up to date with 'origin/pritam'.

Changes not staged for commit:
  modified:   backend/app/api/routes_assurance.py
  modified:   backend/app/models/schemas.py
  modified:   backend/app/services/assurance_service.py
  ml/distribution_shift/detector.py

Untracked files:
  tests/test_api_distribution_shift.py
  docs/distribution_shift_api_implementation_report.md
```
