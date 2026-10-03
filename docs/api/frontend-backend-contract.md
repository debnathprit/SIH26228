# INTEGRATED FRONTEND-BACKEND API SPECIFICATION

> **SPECIFICATION:** Consolidated API Contract for the Trusted Computer Vision Assurance Architecture.
> Standardized protocol definitions connecting frontend assurance consumers and backend assurance engines.
> Production Base URL: `https://sih26228.onrender.com/api/v1` | Local Development: `http://localhost:8000/api/v1`.

---

## 1. General Protocol Conventions

- **Transport:** HTTP / Local REST API (JSON payloads).
- **Default Base URL:** `http://localhost:8000/api/v1`
- **Standard Response Envelope:**
```json
{
  "status": "success",
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-01T08:30:00Z"
}
```
- **Error Response Envelope:**
```json
{
  "status": "error",
  "data": null,
  "error": {
    "code": "DATASET_CORRUPT",
    "message": "Archive missing YOLO labels directory or corrupted zip header."
  },
  "timestamp": "2026-10-01T08:30:00Z"
}
```

---

## 2. Core Endpoints

### 2.1 System Overview
- **Endpoint:** `GET /api/v1/system/overview`
- **Description:** Returns the global system assurance disposition and the 5 pillar status cards.
- **Response `data` Structure:**
```json
{
  "assessmentTimestamp": "2026-10-01T08:30:00Z",
  "globalDisposition": "ACCEPT | REVIEW | QUARANTINE | NOT ASSESSED",
  "globalReason": "Summary justification for overall disposition",
  "evidenceCount": 14,
  "unresolvedFlags": 3,
  "pillars": [
    {
      "id": "dataset",
      "title": "Training Data Integrity",
      "status": "REVIEW",
      "severity": "medium",
      "confidence": 0.88,
      "asset": "Dataset: Sector-7-Recon-v2 (YOLO)",
      "explanation": "Near-duplicate flooding detected in Contributor-04 batch.",
      "evidenceAvailable": true
    },
    {
      "id": "model",
      "title": "Model Integrity",
      "status": "VERIFIED",
      "severity": "low",
      "confidence": 0.94,
      "asset": "Model: yolov8x-recon-fp16.onnx",
      "explanation": "Weight digest verified; no backdoor trigger anomalies.",
      "evidenceAvailable": true
    },
    {
      "id": "inference",
      "title": "Inference Provenance",
      "status": "VERIFIED",
      "severity": "low",
      "confidence": 0.99,
      "asset": "Inference Record #INF-2026-8812",
      "explanation": "Cryptographic binding verified.",
      "evidenceAvailable": true
    },
    {
      "id": "shift",
      "title": "Distribution Shift & Anomaly",
      "status": "REVIEW",
      "severity": "medium",
      "confidence": 0.82,
      "asset": "Operational Feed: Sensor #3",
      "explanation": "Illumination shift vs baseline reference.",
      "evidenceAvailable": true
    },
    {
      "id": "audit",
      "title": "Tamper-Evident Audit Trail",
      "status": "VERIFIED",
      "severity": "low",
      "confidence": 1.0,
      "asset": "Assurance Ledger (Height: 28)",
      "explanation": "Zero broken parent block links.",
      "evidenceAvailable": true
    }
  ]
}
```

---

### 2.2 Dataset Integrity Evaluation
- **Endpoint:** `POST /api/v1/dataset/evaluate`
- **Request (Multipart/Form-Data or JSON descriptor):**
```json
{
  "datasetPath": "/data/Sector-7-Recon-v2.zip",
  "format": "YOLO | COCO",
  "evalConfig": {
    "checkNearDuplicates": true,
    "checkLabelAnomalies": true,
    "checkBackdoorTriggers": true,
    "checkOOD": true
  }
}
```
- **Response `data` Structure:**
```json
{
  "datasetName": "Sector-7-Recon-v2.zip",
  "format": "YOLO",
  "totalSamples": 14250,
  "classesCount": 8,
  "contributorsCount": 5,
  "overallDisposition": "REVIEW",
  "overallSeverity": "medium",
  "overallConfidence": 0.89,
  "recommendation": "Quarantine Contributor-04 batch for analyst relabeling.",
  "findings": {
    "nearDuplicates": {
      "count": 218,
      "percentage": "1.53%",
      "severity": "medium",
      "details": "Dense perceptual hash collision cluster found.",
      "evidenceId": "EVID-DS-001"
    },
    "labelAnomalies": {
      "count": 34,
      "percentage": "0.24%",
      "severity": "high",
      "details": "Suspected label flipping: Military vehicle inverted to civilian SUV.",
      "evidenceId": "EVID-DS-002"
    },
    "triggerBackdoorSuspicion": {
      "count": 3,
      "percentage": "0.02%",
      "severity": "critical",
      "details": "High-frequency checkerboard pattern detected in corner coordinates.",
      "evidenceId": "EVID-DS-003"
    },
    "oodSamples": {
      "count": 76,
      "percentage": "0.53%",
      "severity": "medium",
      "details": "Waterborne vessel imagery inserted into desert terrain dataset.",
      "evidenceId": "EVID-DS-004"
    }
  },
  "contributorRisk": [
    { "id": "SRC-Alpha", "samples": 6200, "rejected": 12, "riskScore": "Low", "status": "VERIFIED" },
    { "id": "SRC-Delta (Contributor-04)", "samples": 1850, "rejected": 194, "riskScore": "High", "status": "REVIEW" }
  ]
}
```

---

### 2.3 Model Integrity Evaluation
- **Endpoint:** `POST /api/v1/model/evaluate`
- **Request:**
```json
{
  "modelPath": "/models/yolov8x-tactical.onnx",
  "format": "ONNX | PYTORCH | TORCHSCRIPT",
  "accessMode": "WHITE-BOX | BLACK-BOX",
  "expectedHash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
}
```
- **Response `data` Structure:**
```json
{
  "modelName": "yolov8x-tactical-surveillance.onnx",
  "format": "ONNX",
  "version": "2.4.1",
  "weightDigest": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  "expectedDigest": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  "accessType": "WHITE-BOX",
  "architecture": "YOLOv8x",
  "overallDisposition": "ACCEPT",
  "confidence": 0.942,
  "limitations": "White-box analysis with synthetic perturbation battery. Does not guarantee physical camouflage immunity.",
  "checks": [
    {
      "check": "Model Substitution Verification",
      "result": "PASS",
      "status": "VERIFIED",
      "details": "Calculated SHA-256 weight digest matches trusted registry."
    },
    {
      "check": "Clean-Label Trigger Search (Neural Cleanse)",
      "result": "PASS",
      "status": "VERIFIED",
      "details": "Anomaly index 1.12 below threshold."
    }
  ]
}
```

---

### 2.4 Inference Cryptographic Verification
- **Endpoint:** `POST /api/v1/inference/verify`
- **Request:**
```json
{
  "recordId": "INF-2026-REC-0089",
  "inputImageHash": "4a44dc15...",
  "modelDigest": "7f83b165...",
  "preprocessingDigest": "1b896944...",
  "inferenceConfigDigest": "e3b0c442...",
  "outputHash": "9f83377d...",
  "nonce": "8849204910293847",
  "timestamp": "2026-10-01T08:14:22.418Z"
}
```
- **Response `data` Structure:**
```json
{
  "recordId": "INF-2026-REC-0089",
  "provenanceStatus": "VERIFIED",
  "tamperingDetected": false,
  "replayDetected": false,
  "overallDisposition": "ACCEPT",
  "binding": {
    "inputImageHash": "4a44dc15364204a80fe80e9039455ec160c7dac38eb30fbe7e07017723e07e6e",
    "modelDigest": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "preprocessingConfigDigest": "1b8969446d7950c406ecb69103e5c942ab71424a04620ddc9bf4f216503c467a",
    "inferenceConfigDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "outputHash": "9f83377d86b1213200ef95a0739182af099f086fb30e339c655ecff96a4d85d5",
    "verifiableRecordDigest": "e499806ef89bf00f3c5fe2843efeb5fc9fa27725ca3158b4ab2f34ee6900cd8d"
  },
  "outputPrediction": {
    "detectedObjects": [
      { "class": "armored_vehicle", "confidence": 0.941, "bbox": [214, 180, 510, 420] }
    ]
  }
}
```

---

### 2.5 Distribution Shift Evaluation
- **Endpoint:** `POST /api/v1/shift/evaluate`
- **Response `data` Structure:**
```json
{
  "operationalUnit": "Sector-North Thermal Surveillance Cam #4",
  "referenceDataset": "Baseline High-Altitude Daylight Reference v1.2",
  "overallSeverity": "medium",
  "overallConfidence": 0.86,
  "classification": "OPERATIONAL DRIFT",
  "manipulationLikelihood": "LOW (12%)",
  "explanation": "Natural winter thermal inversion. No adversarial gradient perturbation found.",
  "dimensions": [
    { "dimension": "Terrain Shift", "shiftValue": "28%", "status": "REVIEW", "note": "Snow accumulation" },
    { "dimension": "Lighting Shift", "shiftValue": "42%", "status": "REVIEW", "note": "Twilight irradiance" },
    { "dimension": "Sensor Dynamics", "shiftValue": "8%", "status": "VERIFIED", "note": "MTF calibrated" }
  ],
  "limitations": "Weather vs non-gradient perturbation boundary depends on reference battery size."
}
```

---

### 2.6 Evidence Ledger
- **Endpoint:** `GET /api/v1/evidence`
- **Response `data` Structure:** List of evidence objects:
```json
[
  {
    "id": "EVID-DS-001",
    "asset": "Sector-7-Recon-v2 (Dataset)",
    "type": "Near-Duplicate Flooding Cluster",
    "hash": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "timestamp": "2026-10-01T07:15:00Z",
    "severity": "medium",
    "confidence": 0.91,
    "source": "Perceptual Hash Distance Engine",
    "explanation": "218 image samples share Hamming distance <= 2."
  }
]
```

---

### 2.7 Tamper-Evident Audit Trail
- **Endpoint:** `GET /api/v1/audit/trail`
- **Endpoint:** `POST /api/v1/audit/verify` (Recalculates block hashes and validates parent linkages)
- **Response `data` Structure:** List of block objects:
```json
[
  {
    "sequence": 1,
    "timestamp": "2026-10-01T06:30:00Z",
    "event": "Dataset Uploaded",
    "asset": "Sector-7-Recon-v2.zip",
    "actor": "Contributor-04 (Field Agent)",
    "eventHash": "a1b2c3d4...",
    "prevHash": "00000000...",
    "verificationStatus": "VERIFIED"
  }
]
```

---

### 2.8 Assurance Report Generation
- **Endpoint:** `GET /api/v1/report/assurance`
- **Response `data` Structure:** Full report object matching `AssuranceReportPage` schema.
