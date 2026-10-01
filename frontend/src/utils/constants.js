/**
 * CV INTEGRITY ASSURANCE — CONSTANTS
 * PS ID 26228 | MoD / Indian Army DGIS
 */

export const DISPOSITIONS = {
  ACCEPT: 'ACCEPT',
  REVIEW: 'REVIEW',
  QUARANTINE: 'QUARANTINE',
  NOT_ASSESSED: 'NOT ASSESSED'
};

export const STATUSES = {
  VERIFIED: 'VERIFIED',
  REVIEW: 'REVIEW',
  QUARANTINE: 'QUARANTINE',
  NOT_ASSESSED: 'NOT ASSESSED',
  PENDING: 'PENDING'
};

export const SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const ACCESS_TYPES = {
  WHITE_BOX: 'WHITE-BOX',
  BLACK_BOX: 'BLACK-BOX'
};

export const DATASET_FORMATS = {
  YOLO: 'YOLO',
  COCO: 'COCO'
};

export const MODEL_FORMATS = {
  ONNX: 'ONNX',
  PYTORCH: 'PyTorch (.pt/.pth)',
  TORCHSCRIPT: 'TorchScript (.pt)'
};

export const SUPPORTED_ATTACK_CLASSES = [
  'Trigger Injection (BadNets, Clean-label backdoor patches)',
  'Label Flipping Attacks (Targeted & Random)',
  'Systematic Mislabeling / Semantic Drift in Annotations',
  'Near-Duplicate Flooding (Poisoning via Density Skew)',
  'Out-of-Distribution Insertion (Feature space outliers)',
  'Model Substitution (Digest mismatch / altered architecture)',
  'Post-Hoc Inference Tampering (Result alteration after execution)',
  'Inference Record Replay (Duplicate nonce / stale timestamp attacks)',
  'Covariate Distribution Shift (Terrain, Season, Sensor, Illumination)'
];

export const UNSUPPORTED_ATTACK_CLASSES = [
  'Physical hardware sensor optic trojans (adversarial laser blinding)',
  'Micro-architectural side-channel power analysis during FPGA/ASIC inference',
  'Real-time volatile memory injection post-inference without OS log capture',
  'Sub-threshold quantum compute cryptographic collision attacks'
];
