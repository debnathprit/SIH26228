# Frontend Architecture Documentation

**Project:** Trustworthy Computer Vision Integrity Assurance for Data, Models and Inference Outputs in Multi-Contributor Pipelines  
**Competition:** Smart India Hackathon 2026 (Problem Statement 26228)  
**Stakeholder:** Ministry of Defence (MoD) / Indian Army (DGIS)  
**Author:** Person B (Frontend, Assurance Dashboard, Evidence & Audit UI Lead)  
**Branch:** `sounava`  

---

## 1. Person B Scope of Responsibility

In this two-person team:
- **Person B (Frontend Engineer):**
  - Analyst-facing dashboard design, usability, and presentation.
  - Multi-contributor CV lifecycle visualization.
  - Evidence and audit trail presentation.
  - Assurance report generation and export UI.
  - Service abstraction layer and contract definitions.
  - Offline / air-gapped environment compliance.
  - Frontend-side testing and presentation demo support.
- **Person A (Backend/ML Engineer):**
  - Dataset integrity engine (label flipping, near-duplicate hashing, trigger scans).
  - Model integrity engine (weight verification, Neural Cleanse, behavioral batteries).
  - Computer vision inference pipeline.
  - Cryptographic evidence generation (SHA-256 digests, HMACs, Merkle logs).
  - Distribution shift analysis (Wasserstein distance, environmental drift classifier).

---

## 2. Technology Stack & Architectural Decisions

- **Framework:** React 18+ (Functional components, hooks).
- **Build Tool:** Vite 6 (ultra-fast compilation, zero build bloat).
- **Styling System:** Modular CSS with CSS Custom Properties (Design tokens).
  - Theme: Restrained dark cybersecurity canvas (`#0b0f17`), high-contrast text, clear semantic border accents.
  - Semantic Status Tokens: `VERIFIED` (green), `REVIEW` (amber), `QUARANTINE` (red), `NOT ASSESSED` (slate).
  - Print Media Support: Dedicated `@media print` styles for executive assurance reporting.
- **Dependencies:** Minimal. Only `react`, `react-dom`, `@vitejs/plugin-react`, and `vite`. Zero heavyweight third-party UI libraries (Tailwind, MUI, etc.) to ensure complete maintainability, transparency, and offline stability.

---

## 3. Strict Offline / Air-Gapped Compliance

In accordance with Indian Army and defense requirements:
1. **Zero External Font Calls:** Uses native system font stacks (`-apple-system`, `Segoe UI`, `Roboto`, `ui-monospace`).
2. **Zero Remote CDNs:** No external CSS, scripts, or icon fonts loaded from un-trusted endpoints.
3. **Local Vector Assets:** All icons are implemented as modular, local SVG components in `src/components/common/Icons.jsx`.
4. **Air-Gapped Operation:** All static assets, fonts, icons, styles, and logic operate entirely inside an isolated local network or disconnected laptop.

---

## 4. Application Layout & Component Hierarchy

```
App
└── AppLayout
    ├── Sidebar (8 Navigation tabs, SVG icons, branch status)
    ├── Header (Page title, air-gapped status pill, global system disposition)
    ├── MockNoticeBanner (Visible "DEMO / MOCK DATA" notice)
    └── Main Content Area
        ├── OverviewPage
        │   ├── SectionCard (Lifecycle flow indicator)
        │   ├── MetricCard grid (Overall disposition, evidence count, unresolved flags)
        │   └── Pillar Cards (Data, Model, Inference, Shift, Audit)
        ├── DatasetAssurancePage
        │   ├── Format Selector (YOLO / COCO) & Archive Upload
        │   ├── MetricCard grid (Samples, Sources, Severity, Disposition)
        │   ├── 4 Threat Cards (Duplicates, Label inversions, Backdoors, OOD)
        │   └── ContributorRiskTable (Source-level risk aggregation)
        ├── ModelAssurancePage
        │   ├── Format Selector (ONNX / PyTorch / TorchScript)
        │   ├── Access Mode Switch (White-box vs Black-box fallback)
        │   ├── Weight Digest Verification Table
        │   ├── Behavioral & Backdoor Check Results
        │   └── Declared Limitations Panel
        ├── InferenceVerificationPage
        │   ├── Cryptographic Binding Pipeline Visualizer
        │   │   (Input + Model + Preproc + InfConfig + Output = Record)
        │   ├── Execution Parameters Panel
        │   └── Sealed Detections Table
        ├── DistributionShiftPage
        │   ├── Operational Feed & Reference Baseline Context
        │   ├── Shift Metrics & Wasserstein Severity
        │   ├── Operational Drift vs. Manipulation Banner
        │   ├── Multi-Dimensional Dimension Breakdown
        │   └── Analytical Limitations Statement
        ├── EvidenceViewerPage
        │   ├── Filter & Search Controls (Severity, ID, Text)
        │   └── Evidence Ledger Table (with HashDisplay truncation & copy)
        ├── AuditTrailPage
        │   ├── Merkle-Linked Block Timeline
        │   ├── Chain Verification Action
        │   └── Previous Hash -> Current Hash Binding Cards
        └── AssuranceReportPage
            ├── Document Metadata & Print Action
            ├── Executive Assessment
            ├── Section-by-Section Lifecycle Findings
            ├── Supported vs. Unsupported Attack Vectors
            ├── Assumptions & Limitations
            └── Analyst Sign-Off
```

---

## 5. Service Abstraction Layer & Data Flow

To prevent API calls from being scattered across UI components:
```
React Components
       ↓
Domain Services (datasetService, modelService, inferenceService, ...)
       ↓
Base Client (api.js)
       ↓
Local Backend (http://localhost:8000/api/v1)
       ↓ (if offline or pending backend endpoint)
Graceful Mock Fallback (src/mock/mockData.js, mockReport.js)
```

Each service function calls `request(endpoint, options, mockFallback)`.
- If the backend is running and responds with 200 OK: the live payload is returned with `{ isMock: false }`.
- If the backend is unreachable or returning errors: the service returns `{ data: mockFallback, isMock: true }`.
- When `isMock: true`, `AppLayout` automatically displays an amber "DEMO / MOCK DATA" banner so analysts and evaluators are never misled.

---

## 6. Phase 1 Verification Criteria

1. Clean build: `npm run build` succeeds without warnings or errors.
2. Fully responsive desktop/laptop analyst layout.
3. Seamless tab navigation across all 8 core views.
4. Expandable cryptographic hashes with one-click copy.
5. Print stylesheet activated when opening the print dialog on Assurance Report.
