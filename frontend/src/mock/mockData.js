/**
 * CV INTEGRITY ASSURANCE — MOCK / DEMO DATA
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * CRITICAL NOTICE:
 * This file contains structured demonstration data for offline standby operation.
 * It provides fallback data structures when the live assurance backend is offline.
 * All entries are explicitly marked with `isMock: true`.
 */

export const mockSystemOverview = {
  isMock: true,
  assessmentTimestamp: '2026-10-01T08:30:00Z',
  globalDisposition: 'REVIEW',
  globalReason: 'Dataset contributor risk skew and minor terrain distribution shift detected. Model weights verified.',
  evidenceCount: 14,
  unresolvedFlags: 3,
  pillars: [
    {
      id: 'dataset',
      title: 'Training Data Integrity',
      status: 'REVIEW',
      severity: 'medium',
      confidence: 0.88,
      asset: 'Dataset: Sector-7-Recon-v2 (YOLO)',
      explanation: 'Near-duplicate flooding detected in Contributor-04 batch; 14 suspected label inversions.',
      evidenceAvailable: true
    },
    {
      id: 'model',
      title: 'Model Integrity',
      status: 'VERIFIED',
      severity: 'low',
      confidence: 0.94,
      asset: 'Model: yolov8x-recon-fp16.onnx',
      explanation: 'Model weight digest matches registry. Behavioral battery shows no trigger activation anomalies.',
      evidenceAvailable: true
    },
    {
      id: 'inference',
      title: 'Inference Provenance',
      status: 'VERIFIED',
      severity: 'low',
      confidence: 0.99,
      asset: 'Inference Record #INF-2026-8812',
      explanation: 'Cryptographic binding verified across input image, model weights, config, and output bbox tensor.',
      evidenceAvailable: true
    },
    {
      id: 'shift',
      title: 'Distribution Shift & Anomaly',
      status: 'REVIEW',
      severity: 'medium',
      confidence: 0.82,
      asset: 'Operational Feed: High-Altitude Flir Sensor #3',
      explanation: 'Material shift in illumination and terrain contrast vs baseline reference training distribution.',
      evidenceAvailable: true
    },
    {
      id: 'audit',
      title: 'Tamper-Evident Audit Trail',
      status: 'VERIFIED',
      severity: 'low',
      confidence: 1.0,
      asset: 'Assurance Ledger (Chain height: 28)',
      explanation: 'All previous hash links match internal cryptographic integrity battery. No tampering detected.',
      evidenceAvailable: true
    }
  ]
};

export const mockDatasetAssurance = {
  isMock: true,
  datasetName: 'Border-Tactical-CV-2026.zip',
  format: 'YOLO',
  totalSamples: 14250,
  classesCount: 8,
  contributorsCount: 5,
  overallDisposition: 'REVIEW',
  overallSeverity: 'medium',
  overallConfidence: 0.89,
  recommendation: 'Quarantine Contributor-04 batch for analyst relabeling; deduplicate cluster #12 before model ingestion.',
  findings: {
    nearDuplicates: {
      count: 218,
      percentage: '1.53%',
      severity: 'medium',
      details: 'Dense perceptual hash collision cluster found originating from Contributor-04.',
      evidenceId: 'EVID-DS-001'
    },
    labelAnomalies: {
      count: 34,
      percentage: '0.24%',
      severity: 'high',
      details: 'Suspected label flipping: Military vehicle annotations inverted to Civilian SUV in 18 samples.',
      evidenceId: 'EVID-DS-002'
    },
    triggerBackdoorSuspicion: {
      count: 3,
      percentage: '0.02%',
      severity: 'critical',
      details: 'High-frequency checkerboard pattern detected in corner bounding boxes of tank class samples.',
      evidenceId: 'EVID-DS-003'
    },
    oodSamples: {
      count: 76,
      percentage: '0.53%',
      severity: 'medium',
      details: 'Feature space outliers detected; waterborne vessel imagery inserted into desert terrain dataset.',
      evidenceId: 'EVID-DS-004'
    }
  },
  contributorRisk: [
    { id: 'SRC-Alpha (HQ Unit)', samples: 6200, rejected: 12, riskScore: 'Low', status: 'VERIFIED' },
    { id: 'SRC-Beta (Forward Post 1)', samples: 3400, rejected: 21, riskScore: 'Low', status: 'VERIFIED' },
    { id: 'SRC-Gamma (Border Recon)', samples: 2150, rejected: 19, riskScore: 'Low', status: 'VERIFIED' },
    { id: 'SRC-Delta (Contributor-04)', samples: 1850, rejected: 194, riskScore: 'High', status: 'REVIEW' },
    { id: 'SRC-Epsilon (Tactical Drone)', samples: 650, rejected: 5, riskScore: 'Low', status: 'VERIFIED' }
  ]
};

export const mockModelAssurance = {
  isMock: true,
  modelName: 'yolov8x-tactical-surveillance.onnx',
  format: 'ONNX',
  version: '2.4.1-rc3',
  weightDigest: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  expectedDigest: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  accessType: 'WHITE-BOX',
  architecture: 'YOLOv8x (Feature Pyramids + Decoupled Head)',
  overallDisposition: 'ACCEPT',
  overallSeverity: 'low',
  confidence: 0.942,
  limitations: 'White-box analysis conducted with synthetic perturbation battery. Does not guarantee robustness against zero-day physical adversarial camouflage.',
  checks: [
    {
      check: 'Model Substitution Verification',
      result: 'PASS',
      status: 'VERIFIED',
      details: 'Calculated SHA-256 weight tensor digest matches trusted military registry exactly.'
    },
    {
      check: 'Clean-Label Trigger Search (Neural Cleanse)',
      result: 'PASS',
      status: 'VERIFIED',
      details: 'Anomaly index 1.12 below threshold (2.0). No anomalous low-norm trigger mask reconstructed.'
    },
    {
      check: 'Weight & Activation Statistics',
      result: 'NORMAL',
      status: 'VERIFIED',
      details: 'Zero aberrant weight spike outliers or dead neuron clusters detected in layer 48-64.'
    },
    {
      check: 'Behavioral Reference Battery',
      result: 'CONSISTENT',
      status: 'VERIFIED',
      details: 'mAP@0.5 of 84.6% matches reference benchmark envelope (84.1% - 85.0%).'
    }
  ]
};

export const mockInferenceVerification = {
  isMock: true,
  recordId: 'INF-2026-REC-0089',
  timestamp: '2026-10-01T08:14:22.418Z',
  nonce: '8849204910293847',
  sequenceNumber: 1042,
  provenanceStatus: 'VERIFIED',
  tamperingDetected: false,
  replayDetected: false,
  overallDisposition: 'ACCEPT',
  binding: {
    inputImageHash: '4a44dc15364204a80fe80e9039455ec160c7dac38eb30fbe7e07017723e07e6e',
    modelDigest: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    preprocessingConfigDigest: '1b8969446d7950c406ecb69103e5c942ab71424a04620ddc9bf4f216503c467a',
    inferenceConfigDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    outputHash: '9f83377d86b1213200ef95a0739182af099f086fb30e339c655ecff96a4d85d5',
    verifiableRecordDigest: 'e499806ef89bf00f3c5fe2843efeb5fc9fa27725ca3158b4ab2f34ee6900cd8d'
  },
  preprocessingDetails: {
    resolution: '1280x1280',
    colorSpace: 'RGB_NORMALIZED',
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225]
  },
  inferenceDetails: {
    batchSize: 1,
    confThreshold: 0.45,
    iouThreshold: 0.50,
    fp16Mode: true
  },
  outputPrediction: {
    detectedObjects: [
      { class: 'armored_vehicle', confidence: 0.941, bbox: [214, 180, 510, 420] },
      { class: 'utility_truck', confidence: 0.887, bbox: [620, 310, 840, 520] }
    ]
  }
};

export const mockDistributionShift = {
  isMock: true,
  operationalUnit: 'Sector-North Thermal Surveillance Cam #4',
  referenceDataset: 'Baseline High-Altitude Daylight Reference v1.2',
  assessmentTimestamp: '2026-10-01T08:22:00Z',
  overallSeverity: 'medium',
  overallConfidence: 0.86,
  classification: 'OPERATIONAL DRIFT',
  manipulationLikelihood: 'LOW (12%)',
  explanation: 'Observed deviation is predominantly atmospheric and seasonal (winter dusk thermal inversion). No targeted adversarial noise signature detected.',
  dimensions: [
    { dimension: 'Terrain Shift', shiftValue: '28%', status: 'REVIEW', note: 'Snow accumulation altering ground albedo' },
    { dimension: 'Lighting / Illumination', shiftValue: '42%', status: 'REVIEW', note: 'Low-angle winter twilight irradiance' },
    { dimension: 'Sensor Dynamics', shiftValue: '8%', status: 'VERIFIED', note: 'Optic MTF and gain within calibrated limits' },
    { dimension: 'Seasonal Variance', shiftValue: '55%', status: 'REVIEW', note: 'Vegetation canopy reduction' },
    { dimension: 'Acquisition Geometry', shiftValue: '14%', status: 'VERIFIED', note: 'Oblique sensor pitch angle steady' }
  ],
  limitations: 'Distinction between extreme natural meteorological shift and gradient-free optical manipulation is bounded by reference battery diversity.'
};

export const mockEvidenceList = [
  {
    id: 'EVID-DS-001',
    asset: 'Sector-7-Recon-v2 (Dataset)',
    type: 'Near-Duplicate Flooding Cluster',
    hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    timestamp: '2026-10-01T07:15:00Z',
    severity: 'medium',
    confidence: 0.91,
    source: 'Perceptual Hash Distance Engine',
    explanation: '218 image samples share pHash Hamming distance <= 2, concentrated in Contributor-04 subfolder.'
  },
  {
    id: 'EVID-DS-002',
    asset: 'Sector-7-Recon-v2 (Dataset)',
    type: 'Label Inversion Anomaly',
    hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    timestamp: '2026-10-01T07:18:22Z',
    severity: 'high',
    confidence: 0.87,
    source: 'Semantic Embeddings Outlier Detector',
    explanation: 'Visual features in 18 samples belong to armor vehicle cluster but labeled civilian SUV.'
  },
  {
    id: 'EVID-DS-003',
    asset: 'Sector-7-Recon-v2 (Dataset)',
    type: 'Backdoor Trigger Suspicion',
    hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    timestamp: '2026-10-01T07:22:10Z',
    severity: 'critical',
    confidence: 0.84,
    source: 'Spectral Signature & Patch Analyzer',
    explanation: 'Spatial frequency artifact in pixel coordinates (32, 32) correlated with class label override.'
  },
  {
    id: 'EVID-MD-001',
    asset: 'yolov8x-recon-fp16.onnx (Model)',
    type: 'Cryptographic Weight Verification',
    hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    timestamp: '2026-10-01T07:45:12Z',
    severity: 'low',
    confidence: 1.0,
    source: 'Model Ingestion Checksum Engine',
    explanation: 'Model byte stream SHA-256 precisely matches signed registry entry issued by Arsenal Systems Lab.'
  },
  {
    id: 'EVID-INF-001',
    asset: 'INF-2026-REC-0089 (Inference)',
    type: 'Inference Provenance Binding',
    hash: 'e499806ef89bf00f3c5fe2843efeb5fc9fa27725ca3158b4ab2f34ee6900cd8d',
    timestamp: '2026-10-01T08:14:22Z',
    severity: 'low',
    confidence: 0.99,
    source: 'Cryptographic Provenance Engine',
    explanation: 'Unified HMAC binds input image digest, model weight digest, inference params, and output coordinates.'
  }
];

export const mockAuditTrail = [
  {
    sequence: 1,
    timestamp: '2026-10-01T06:30:00Z',
    event: 'Dataset Uploaded',
    asset: 'Sector-7-Recon-v2.zip',
    actor: 'Contributor-04 (Field Agent)',
    eventHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    verificationStatus: 'VERIFIED'
  },
  {
    sequence: 2,
    timestamp: '2026-10-01T07:15:00Z',
    event: 'Dataset Evaluated',
    asset: 'Sector-7-Recon-v2.zip',
    actor: 'Integrity Engine Service v1.2',
    eventHash: 'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0a',
    prevHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    verificationStatus: 'REVIEW'
  },
  {
    sequence: 3,
    timestamp: '2026-10-01T07:40:00Z',
    event: 'Model Registered',
    asset: 'yolov8x-tactical-surveillance.onnx',
    actor: 'Arsenal ML Lab Depot',
    eventHash: 'c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0a1b',
    prevHash: 'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0a',
    verificationStatus: 'VERIFIED'
  },
  {
    sequence: 4,
    timestamp: '2026-10-01T07:55:00Z',
    event: 'Model Evaluated',
    asset: 'yolov8x-tactical-surveillance.onnx',
    actor: 'Model Behavioral Battery Scanner',
    eventHash: 'd4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0a1b2c',
    prevHash: 'c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0a1b',
    verificationStatus: 'VERIFIED'
  },
  {
    sequence: 5,
    timestamp: '2026-10-01T08:14:22Z',
    event: 'Inference Generated & Bound',
    asset: 'INF-2026-REC-0089',
    actor: 'Forward Edge Inference Unit #2',
    eventHash: 'e499806ef89bf00f3c5fe2843efeb5fc9fa27725ca3158b4ab2f34ee6900cd8d',
    prevHash: 'd4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0a1b2c',
    verificationStatus: 'VERIFIED'
  },
  {
    sequence: 6,
    timestamp: '2026-10-01T08:25:00Z',
    event: 'Assurance Report Compiled',
    asset: 'ASR-REPORT-2026-10-01',
    actor: 'Lead Assurance Analyst',
    eventHash: 'f5e6d7c8b9a0123456789abcdef0123456789abcdef0123456789abcdef0a1b2',
    prevHash: 'e499806ef89bf00f3c5fe2843efeb5fc9fa27725ca3158b4ab2f34ee6900cd8d',
    verificationStatus: 'VERIFIED'
  }
];
