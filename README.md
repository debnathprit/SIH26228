# 🛡️ CV-INTEGRITY: Trusted Computer Vision Assurance Architecture
### *Ministry of Defence (MoD) / Indian Army — Directorate General of Information Systems (DGIS)*
**Smart India Hackathon 2026 | Problem Statement ID: 26228**

---

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Air--Gapped](https://img.shields.io/badge/Security-Air--Gapped%20Zero--Trust-00C853?style=flat-square)](https://github.com)
[![Tests](https://img.shields.io/badge/Tests-71%20Passed-brightgreen?style=flat-square)](https://github.com)

---

## 📌 Executive Summary

Modern military computer vision systems rely heavily on multi-contributor pipelines: datasets and model weights arrive from decentralized forward operating bases, unmanned aerial vehicles (UAVs), reconnaissance patrols, intelligence headquarters, allied units, and third-party contractors.

This introduces critical **supply-chain vulnerabilities**:
* **Data Poisoning & Label Inversion:** Adversaries inverting annotations (e.g., tagging a hostile Main Battle Tank or Armored Vehicle as a *Civilian SUV* to suppress automated targeting/alert systems).
* **Latent Backdoor Trojans:** High-frequency spatial/spectral triggers (BadNets, clean-label checkerboards) that remain completely dormant during standard accuracy testing but force catastrophic misclassifications upon presentation of a physical adversary trigger.
* **Density Skew / Near-Duplicate Flooding:** Rogue contributors injecting perceptual duplicates to poison class priors.
* **Inference Output Tampering & Replay Attacks:** Man-in-the-middle tampering of live bounding box coordinates and replay of stale reconnaissance video streams.
* **Covariate / Environmental Drift:** Inability of conventional systems to differentiate benign natural weather shifts (snow albedo, low-angle twilight) from targeted optical adversarial noise.

**CV-INTEGRITY (SIH PS 26228)** delivers an **end-to-end, air-gapped, cryptographically bound assurance framework** that continuously inspects, validates, and mathematically binds datasets, model weights, live inferences, and audit logs into an immutable cryptographic chain of custody.

---

## 🏛️ The Five Core Capability Pillars

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CV-INTEGRITY ASSURANCE SUITE                                      │
├─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┬─────────────────┤
│      PILLAR 1       │      PILLAR 2       │      PILLAR 3       │      PILLAR 4       │    PILLAR 5     │
│   DATA INTEGRITY    │   MODEL INTEGRITY   │ INFERENCE PROVENANCE│ DISTRIBUTION SHIFT  │ AUDIT LEDGER    │
├─────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼─────────────────┤
│ • pHash Deduplication│ • SHA-256 Checksum  │ • HMAC-SHA256 Chain │ • Wasserstein-1 ($W_1$)│ • Merkle-Linked │
│ • Label Inversion   │ • Neural Cleanse    │ • Anti-Replay Nonce │ • Covariate Drift   │   Hash Chain    │
│ • Spectral Backdoors│ • Layer 40-64 Stats │ • Coordinate Seal   │ • Manipulation Risk │ • Parent Hash   │
│ • Source Isolation  │ • White/Black-Box   │ • Deterministic Run │ • Terrain/Lighting  │   Verification  │
└─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┴─────────────────┘
```

### 1. Training-Data Integrity Assurance
* **Multi-Contributor Trust Aggregation:** Quantifies anomaly rates across distributed units (`SRC-Alpha`, `SRC-Beta`, `SRC-Gamma`, `SRC-Delta`, `SRC-Epsilon`). Surgically isolates and quarantines malicious or compromised contributors without invalidating the entire corpus.
* **Near-Duplicate Flooding Analysis:** Leverages Perceptual Hashing (pHash / dHash) with Hamming distance clustering ($\le 2$) to detect density skew and sybil poisoning.
* **Label Inversion & Semantic Drift:** Employs confident learning and feature-space embedding outlier detection to identify systematic misannotations (e.g., military vehicles inverted to civilian cars).
* **Spectral Frequency Backdoor Detection:** Scans bounding box corner coordinates via Fast Fourier Transform (FFT) and wavelet decomposition to detect high-frequency trigger artifacts.

### 2. Model Integrity & Behavioral Assessment
* **Two-Tier Model Verification:**
  1. *Cryptographic Verification:* Validates model weight tensor SHA-256 digests against defense-accredited registries (e.g., Arsenal ML Lab Depot).
  2. *Deep Behavioral Scrutiny:* Recognizes that cryptographic digests do **not** protect against latent backdoors baked in *prior* to registry sign-off.
* **Neural Cleanse Trigger Reverse-Engineering:** Computes $L_1$ trigger norm anomaly indices across all classes. Flags any class where the anomaly index exceeds the defense threshold of $2.0$.
* **Internal Activation & Weight Statistics:** White-box parameter analysis scanning layers 40–64 for aberrant weight spike outliers and dead neuron clusters.
* **Adaptive Black-Box Fallback:** Gracefully degrades to query-battery perturbation testing with explicit operational notice when full parameter access is unavailable.

### 3. Inference Provenance & Cryptographic Binding
* **End-to-End Cryptographic Binding Chain:** Mathematically locks the entire runtime context into a unified verifiable record:
  $$\text{Record Digest} = \text{HMAC-SHA256}(H(\text{Image}) \mathbin{\Vert} H(\text{Weights}) \mathbin{\Vert} H(\text{Preproc}) \mathbin{\Vert} H(\text{Config}) \mathbin{\Vert} H(\text{Output}) \mathbin{\Vert} \text{Nonce})$$
* **Anti-Replay Nonce & Sequence Counters:** Guarantees temporal freshness; neutralizes video-stream loop replays during active troop maneuvers.
* **Sealed Inference Outputs:** Cryptographically seals target classes, confidence scores, and protected bounding box coordinates $[X_1, Y_1, X_2, Y_2]$ to prevent downstream Man-in-the-Middle alterations.

### 4. Distribution Shift & Anomaly Analysis
* **Root-Cause Operational Drift Discrimination (RODI):** Crucial breakthrough for defense applications: discriminates benign meteorological shifts from adversarial attacks.
* **Wasserstein-1 Metric Envelope:** Calculates statistical Earth Mover's Distance ($W_1$) to quantify live sensor deviation against accredited daylight reference baselines.
* **Environmental Dimension Breakdown:** Disaggregates shift into 5 distinct physical covariates:
  * **Terrain Shift (28%):** Snow accumulation altering ground albedo.
  * **Lighting / Illumination (42%):** Low-angle winter twilight irradiance.
  * **Sensor Dynamics (8% - Verified):** Optics modulation transfer function (MTF) within limits.
  * **Seasonal Variance (55%):** Winter vegetation canopy loss.
  * **Acquisition Geometry (14% - Verified):** Sensor pitch and drone gimbal angle stability.
* **Adversarial Manipulation Risk Calculation:** Reports low targeted adversarial likelihood ($12\%$), preventing false alarms and operational paralysis in harsh terrain.

### 5. Tamper-Evident Chronological Audit Ledger
* **Sequential Merkle-Linked HashChain:** Implements a cryptographically linked ledger where:
  $$\text{Hash}(N) = \text{SHA-256}(\text{Block Data} \mathbin{\Vert} \text{Parent Hash}(N-1))$$
* **Non-Repudiation & Zero Broken Links:** Any retroactive modification to past records (e.g., altering a quarantined contributor's log) breaks the entire downstream hash chain.
* **On-Demand Chain Verification:** Interactive client/server cryptographic audit confirming `Zero Broken Parent Links`.

---

## 📜 Official Assurance Evaluation Report (Capstone)

The platform automatically synthesizes all pipeline evidence into an official, exportable **Defense Computer Vision Assurance Document**:
* **Report ID:** `ASR-2026-DGIS-0042`
* **Classification:** `OFFICIAL-SENSITIVE // DEFENCE ASSURANCE`
* **Evaluating Body:** `Indian Army DGIS — Computer Vision Integrity Cell`
* **Supported Attack Vectors:** Trigger injection (BadNets, clean-label), label flipping, semantic annotation drift, near-duplicate density flooding, feature-space OOD insertion, model checkpoint substitution, post-hoc inference tampering, replay attacks, and covariate shift.
* **Declared Out-of-Scope Boundaries:** Hardware optic laser blinding, micro-architectural side-channel power analysis, volatile RAM injection without OS logs, and quantum compute collision attacks.
* **Formal Sign-Off:** Dual-officer accountability featuring *Lead Computer Vision Assurance Analyst* and *Technical Director, DGIS Integrity Verification Office*.

---

## 🔒 Air-Gapped & Zero-Trust Architecture

Built specifically to satisfy Indian Army and Ministry of Defence operational doctrine:
1. **Zero External Font Calls:** Employs native operating system font stacks (`-apple-system`, `Segoe UI`, `Roboto`, `ui-monospace`).
2. **Zero Remote CDN Dependencies:** No external CSS, scripts, or icon fonts loaded from third-party networks.
3. **Local Vector Assets:** 100% inline local SVGs for icons and visualizations.
4. **Offline-First Fallback:** Seamlessly operates in isolated, disconnected field command centers, ruggedized forward laptops, or secure local networks.

---

## 🏗️ System Architecture & Workflow

```
                                  MULTI-CONTRIBUTOR SOURCES
                     [HQ Unit]   [Forward Post 1]   [Border Recon]   [Tactical Drone]
                         │              │                  │                │
                         └──────────────┴─────────┬────────┴────────────────┘
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │  TRAINING DATA INTEGRITY ENGINE │
                                 │  • pHash Deduplication (Hamming)│
                                 │  • Label Inversion (Embedding)  │
                                 │  • Spectral Backdoor Scanner    │
                                 └────────────────┬────────────────┘
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │  MODEL ASSURANCE / VERIFICATION │
                                 │  • SHA-256 Weight Checksum      │
                                 │  • Neural Cleanse Anomaly Scan  │
                                 │  • Layer 40-64 Parameter Stats  │
                                 └────────────────┬────────────────┘
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │   INFERENCE PROVENANCE BINDING  │
                                 │  • Input + Model + Config HMAC  │
                                 │  • Nonce & Anti-Replay Lock     │
                                 │  • Sealed Bounding Box Output   │
                                 └────────────────┬────────────────┘
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │  DISTRIBUTION SHIFT EVALUATION  │
                                 │  • Wasserstein-1 ($W_1$) Engine │
                                 │  • RODI Environmental Classifier│
                                 └────────────────┬────────────────┘
                                                  ▼
               ┌─────────────────────────────────────────────────────────────────────┐
               │              TAMPER-EVIDENT CHRONOLOGICAL AUDIT LEDGER              │
               │  [Block #1] ───► [Block #2] ───► [Block #3] ───► [Block #4..6]      │
               │  Dataset Upload  Dataset Audit   Model Register  Inference & Report │
               └──────────────────────────────────┬──────────────────────────────────┘
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │ REACT / VITE ASSURANCE DASHBOARD│
                                 │  • Executive Telemetry & Pills  │
                                 │  • Interactive Evidence Ledger  │
                                 │  • Official Defense PDF Export  │
                                 └─────────────────────────────────┘
```

---

## 📁 Repository Structure

```
SIH-26228/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_assurance.py      # /assurance/summary & /distribution-shift/evaluate
│   │   │   └── routes_system.py         # /health & /system/overview
│   │   ├── models/
│   │   │   └── schemas.py               # Pydantic envelopes, pillars, and evidence models
│   │   ├── services/
│   │   │   └── assurance_service.py     # Aggregated 5-pillar evaluation engine
│   │   ├── utils/
│   │   │   └── crypto_utils.py          # SHA-256, HMAC, and canonical hashing utilities
│   │   └── main.py                      # FastAPI app entry point & CORS configuration
│   └── requirements.txt                 # Core dependencies (Torch, OpenCV, ONNX, FastAPI)
├── blockchain/
│   └── ledger/
│       └── hash_chain.py                # Sequential SHA-256 Merkle-linked audit ledger
├── ml/
│   ├── dataset_analyzer/
│   │   └── analyzer.py                  # pHash deduplication, label inversion, trigger scans
│   ├── model_integrity/
│   │   └── verifier.py                  # Neural Cleanse reverse-engineering & weight verification
│   └── distribution_shift/
│       └── detector.py                  # Wasserstein-1 distance & covariate drift classifier
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                  # Icons, StatusBadge, SectionCard, Button
│   │   │   └── layout/                  # AppLayout, Sidebar, Header, Telemetry
│   │   ├── pages/
│   │   │   ├── Overview/                # Executive Assurance Overview
│   │   │   ├── DatasetAssurance/        # Pillar 1 UI & Multi-contributor table
│   │   │   ├── ModelAssurance/          # Pillar 2 UI, Neural Cleanse & Black-Box toggle
│   │   │   ├── InferenceVerification/   # Pillar 3 UI & Cryptographic binding flow
│   │   │   ├── DistributionShift/       # Pillar 4 UI & Environmental breakdown
│   │   │   ├── Evidence/                # Searchable & Filterable Evidence Ledger
│   │   │   ├── AuditTrail/              # Visual Chronological HashChain
│   │   │   └── AssuranceReport/         # Official DGIS Defense Evaluation Report
│   │   ├── services/
│   │   │   └── api.js                   # Base API client with offline-first fallback
│   │   ├── App.jsx                      # Client router & lifecycle state
│   │   └── index.css                    # Dark cybersecurity theme & print styles
│   └── package.json                     # Minimal dependency manifest (React 18, Vite 6)
├── data/
│   └── sample/                          # Reference test imagery & baseline tensors
├── tests/
│   ├── test_assurance_routes.py         # API contract & response envelope tests
│   ├── test_distribution_shift.py       # Mathematical drift detection unit tests
│   ├── test_hash_chain.py               # Blockchain ledger tamper-detection tests
│   └── test_model_integrity.py          # Weight checksum & Neural Cleanse tests
├── docs/
│   ├── api/frontend-backend-contract.md # Complete REST specification
│   └── architecture/                    # Frontend & subsystem architectural guides
├── Dockerfile                           # Multi-stage production container manifest
└── README.md                            # Primary project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python:** `3.10+` (Python 3.11 recommended)
* **Node.js:** `18.0+`
* **Docker:** *(Optional, for containerized deployment)*

---

### Option A: Local Development Setup

#### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-org/sih26228-cv-integrity.git
cd sih26228-cv-integrity

# Create and activate virtual environment
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Launch FastAPI ASGI Server (Default: http://localhost:8000)
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Interactive Swagger API Docs: `http://localhost:8000/docs`
* ReDoc Specification: `http://localhost:8000/redoc`

#### 2. Frontend Setup
```bash
# In a new terminal window
cd frontend

# Install minimal dependencies
npm install

# Start Vite Development Server
npm run dev
```
* Dashboard Application: `http://localhost:5174` (or `http://localhost:5173`)

---

### Option B: Docker Containerized Deployment

Run the complete backend, ML evaluation modules, and hash-chain ledger in an isolated container:

```bash
# Build the production Docker image
docker build -t cv-integrity-backend:latest .

# Run the container (Maps to host port 8000)
docker run -d \
  --name cv-integrity \
  -p 8000:8000 \
  -e ALLOWED_ORIGINS="http://localhost:5174,http://localhost:5173" \
  cv-integrity-backend:latest

# Check container health status
docker inspect --format='{{json .State.Health.Status}}' cv-integrity
```

---

## 🧪 Verification & Test Suite

The repository contains an exhaustive test suite covering cryptographic ledger tamper detection, mathematical distribution shift metrics, and API contract invariants.

```bash
# Run all unit and integration tests
python -m unittest discover -s tests -p "test_*.py" -v
```

**Expected Result:**
```
Ran 71 tests in 1.428s
OK
```

---

## 🌐 API Specification Reference

All endpoints adhere strictly to the standardized **API Response Envelope**:

```json
{
  "status": "success",
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-01T08:35:00Z"
}
```

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status and air-gapped readiness probe |
| `GET` | `/api/v1/system/overview` | Global assurance disposition and 5-pillar status cards |
| `GET` | `/api/v1/assurance/summary` | Consolidated executive lifecycle assurance summary |
| `POST`| `/api/v1/assurance/distribution-shift/evaluate` | Uploads operational query image for real-time Wasserstein drift analysis |
| `GET` | `/docs` | Interactive OpenAPI / Swagger UI documentation |

---

## 🎯 Smart India Hackathon (SIH 26228) Compliance Matrix

| MoD / Indian Army DGIS Requirement | Implementation in CV-INTEGRITY | Verification Reference |
| :--- | :--- | :--- |
| **Multi-Contributor Trust Model** | Quantified anomaly tracking per source (`SRC-Alpha` to `SRC-Epsilon`); isolated quarantine of `Contributor-04`. | `DatasetAssurancePage.jsx`, `analyzer.py` |
| **Data Poisoning & Label Inversion** | Perceptual hash collision ($\le 2$), semantic embedding distance, FFT spectral patch scan. | Evidence records `#EVID-DS-001` - `#003` |
| **Backdoor / Trojan Detection** | Neural Cleanse reverse-engineering ($L_1$ norm anomaly index $1.12 < 2.0$), layer 40-64 activation stats. | `ModelAssurancePage.jsx`, `verifier.py` |
| **Tamper-Proof Inferences** | Unified HMAC-SHA256 binding across image, model, config, and output; cryptographic anti-replay nonces. | `InferenceVerificationPage.jsx`, `#EVID-INF-001` |
| **Environmental vs Attack Discrimination** | Wasserstein-1 distance ($W_1$) & RODI classification distinguishing snow/twilight drift from malicious noise. | `DistributionShiftPage.jsx`, `detector.py` |
| **Immutable Chain of Custody** | Chronological SHA-256 Merkle-linked audit ledger with zero broken parent links and on-demand verification. | `AuditTrailPage.jsx`, `hash_chain.py` |
| **Air-Gapped Operational Readiness** | Zero external fonts, zero CDN calls, local SVG icons, offline-first fallback client. | `frontend-architecture.md`, `Dockerfile` |

---

## 📄 License & Defence Disclaimers

* **Classification:** OFFICIAL-SENSITIVE // DEFENCE ASSURANCE
* **Stakeholder:** Ministry of Defence (MoD) / Indian Army (DGIS)
* Developed for **Smart India Hackathon 2026 (Problem Statement 26228)**.
* *Notice: System assumptions and limitations are explicitly declared in accordance with military AI trustworthiness standards. Synthetic perturbation evaluations do not guarantee immunity against zero-day physical adversarial camouflage.*
