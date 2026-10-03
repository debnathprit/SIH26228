/**
 * CV INTEGRITY ASSURANCE — MOCK ASSURANCE REPORT
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * CRITICAL NOTICE:
 * This is a structured mock report demonstrating the final analyst artifact.
 * Clearly marked with `isMock: true`.
 */

import { SUPPORTED_ATTACK_CLASSES, UNSUPPORTED_ATTACK_CLASSES } from '../utils/constants';

export const mockAssuranceReport = {
  isMock: true,
  reportId: 'ASR-2026-DGIS-0042',
  dateGenerated: '2026-10-01T08:35:00Z',
  classification: 'OFFICIAL-SENSITIVE // DEFENCE ASSURANCE',
  evaluatingOrganization: 'Indian Army DGIS — Computer Vision Integrity Cell',
  targetPipeline: 'Multi-Contributor Tactical Reconnaissance Pipeline v2',
  executiveAssessment: {
    recommendedDisposition: 'REVIEW',
    overallSeverity: 'medium',
    overallConfidence: 0.88,
    summary: 'The evaluation identified medium-severity dataset integrity risks and moderate environmental distribution shift. The model weights and inference provenance chains are verified. Deployment to operational systems should be delayed until the Contributor-04 batch is quarantined and near-duplicate flooding is mitigated.'
  },
  sectionEvaluations: [
    {
      section: '1. Training Data Integrity',
      status: 'REVIEW',
      severity: 'medium',
      confidence: 0.89,
      findings: 'Near-duplicate sample flooding detected originating from Contributor-04 (218 samples). 34 suspected label inversions in tactical vehicle categories. 3 high-frequency trigger anomalies detected.'
    },
    {
      section: '2. Model Integrity',
      status: 'VERIFIED',
      severity: 'low',
      confidence: 0.94,
      findings: 'Model weight digest verified against Arsenal register. Neural Cleanse anomaly index 1.12 is within normal bounds. No model substitution detected.'
    },
    {
      section: '3. Inference Provenance',
      status: 'VERIFIED',
      severity: 'low',
      confidence: 0.99,
      findings: 'Cryptographic binding verified: Input hash + Model digest + Preprocessing digest + Output tensor hash are linked via valid HMAC. Nonce sequence checks confirm no record replay.'
    },
    {
      section: '4. Distribution Shift & Anomaly',
      status: 'REVIEW',
      severity: 'medium',
      confidence: 0.86,
      findings: 'Observed terrain and illumination drift consistent with high-altitude snow conditions. Classified as natural operational drift rather than targeted optical manipulation.'
    },
    {
      section: '5. Tamper-Evident Audit Trail',
      status: 'VERIFIED',
      severity: 'low',
      confidence: 1.0,
      findings: 'Hash chain of 6 consecutive administrative and operational blocks verified without broken parent links.'
    }
  ],
  assumptions: [
    'Evaluator possesses either white-box weights or verifiable cryptographic hashes of target models.',
    'Operational inference nodes utilize synchronized monotonic clocks or cryptographically validated counter nonces.',
    'Reference training distribution baseline dataset was validated prior to operational sensor deployment.'
  ],
  limitations: [
    'Black-box model assessment cannot detect dormant backdoors triggered solely by complex multi-feature composite triggers.',
    'Atmospheric weather anomalies may cause distribution shifts that mimic low-norm adversarial noise without ground truth telemetry.',
    'Assurance does not provide zero-day hardware compromise detection at the physical camera sensor level.'
  ],
  supportedAttackClasses: SUPPORTED_ATTACK_CLASSES,
  unsupportedAttackClasses: UNSUPPORTED_ATTACK_CLASSES,
  signOff: {
    analystName: 'Lead Computer Vision Assurance Analyst',
    reviewedBy: 'Technical Director, DGIS Integrity Verification Office',
    status: 'PENDING ADMINISTRATIVE ACTION'
  }
};
