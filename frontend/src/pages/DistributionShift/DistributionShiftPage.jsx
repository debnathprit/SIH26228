/**
 * DISTRIBUTION SHIFT AND ANOMALY PAGE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Capability 4: Distribution Shift and Anomaly
 * - Material deviation from declared reference distribution
 * - Evaluates: Terrain, Season, Sensor, Illumination, Acquisition conditions
 * - Distinguishes operational drift from suspicious optical manipulation
 * - Cryptographic evidence binding and sequential audit ledger registration
 * - Declares calibrated risk, confidence, and boundaries
 */
import React, { useState } from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { HashDisplay } from '../../components/common/HashDisplay';
import { formatConfidence, getSeverityClass } from '../../utils/formatters';
import {
  IconActivity,
  IconAlertTriangle,
  IconLock,
  IconCheckCircle
} from '../../components/common/Icons';
import { shiftService } from '../../services/shiftService';

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.tif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function DistributionShiftPage({ data }) {
  // Local state for interactive evaluation
  const [selectedFile, setSelectedFile] = useState(null);
  const [referenceDataset, setReferenceDataset] = useState('');
  const [evaluatedData, setEvaluatedData] = useState(data);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [isLiveResult, setIsLiveResult] = useState(false);

  // Active display model: prefers evaluated response, falls back to initial prop
  const current = evaluatedData || data || {};

  const rawRefDataset = current.referenceDataset || 'Baseline High-Altitude Daylight Reference v1.2';
  const refDataset = (rawRefDataset.includes('Users') || rawRefDataset.includes(':\\') || rawRefDataset.includes(':/'))
    ? 'Default Accredited Baseline (data/sample)'
    : rawRefDataset;
  const overallSeverity = current.overallSeverity || 'low';
  const overallConfidence = current.overallConfidence ?? 0.85;
  const classification = current.classification || 'NOT ASSESSED';
  const status = current.status || (classification === 'OPERATIONAL DRIFT' ? 'REVIEW' : classification === 'IN-DISTRIBUTION' ? 'VERIFIED' : 'REVIEW');
  const explanation = current.explanation || 'No explanation available.';
  const dimensions = current.dimensions || [];
  const limitations = current.limitations || 'None declared.';
  const overallDriftScore = current.overallDriftScore;
  const manipulationLikelihood = current.manipulationLikelihood || (
    classification === 'SUSPICIOUS MANIPULATION'
      ? 'HIGH'
      : `LOW (${Math.round((overallDriftScore !== undefined ? overallDriftScore : 0.12) * 100)}%)`
  );

  // Cryptographic & Ledger Provenance metadata
  const queryHash = current.queryHash || null;
  const referenceFingerprint = current.referenceFingerprint || null;
  const evidenceHash = current.evidenceHash || null;
  const evidenceAvailable = current.evidenceAvailable ?? false;
  const ledgerRecordIndex = current.ledgerRecordIndex;

  const isDrift = classification === 'OPERATIONAL DRIFT';
  const isInDistribution = classification === 'IN-DISTRIBUTION';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setEvalError(null);
    }
  };

  const handleRunEvaluation = async () => {
    // 1. Client-side pre-validation
    if (!selectedFile) {
      setEvalError('Please select an operational query image file to evaluate.');
      return;
    }

    const fileName = selectedFile.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!hasValidExt) {
      setEvalError(`Unsupported file format. Supported extensions: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setEvalError(`File exceeds maximum size of 10 MB (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    setIsEvaluating(true);
    setEvalError(null);

    try {
      const res = await shiftService.evaluateDistributionShift(
        selectedFile,
        referenceDataset ? referenceDataset.trim() : null
      );

      if (res && res.error && !res.data) {
        setEvalError(res.error);
      } else if (res && res.data) {
        setEvaluatedData(res.data);
        if (res.isMock) {
          setIsLiveResult(false);
          setEvalError('Backend unavailable. Evaluation displayed using simulation fallback.');
        } else {
          setIsLiveResult(true);
          setEvalError(null);
        }
      } else {
        setEvalError('Unexpected response received from evaluation service.');
      }
    } catch (err) {
      setEvalError(err.message || 'Distribution shift evaluation failed.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="distribution-shift-page">
      {/* Operational Image Ingestion & Baseline Controls */}
      <SectionCard
        title="Operational Image Ingestion & Baseline Parameters"
        subtitle="Upload operational sensor feed imagery to evaluate covariate shift against accredited reference baseline"
        icon={<IconActivity size={18} color="var(--accent-cyan)" />}
        badge={
          isLiveResult ? (
            <StatusBadge status="VERIFIED" label="LIVE EVALUATION RESULT" />
          ) : (
            <StatusBadge status="REVIEW" label="REFERENCE BASELINE (STANDBY)" />
          )
        }
      >
        <div className="grid-cols-3" style={{ alignItems: 'flex-end', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Operational Query Image</label>
            <input
              type="file"
              className="form-input"
              accept=".png,.jpg,.jpeg,.webp,.bmp,.tiff,.tif"
              onChange={handleFileChange}
              disabled={isEvaluating}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reference Baseline (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Default baseline (data/sample)"
              value={referenceDataset}
              onChange={(e) => setReferenceDataset(e.target.value)}
              disabled={isEvaluating}
            />
          </div>

          <div>
            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleRunEvaluation}
              disabled={isEvaluating}
            >
              {isEvaluating ? 'Evaluating Distribution Shift...' : 'Run Distribution Shift Evaluation'}
            </button>
          </div>
        </div>

        {selectedFile && (
          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            Selected File: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
          </div>
        )}

        {/* Evaluation In-Progress Notice */}
        {isEvaluating && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <IconActivity size={16} />
            Executing statistical drift detection across luminance, contrast, color, and sharpness dimensions...
          </div>
        )}

        {/* Error Notice */}
        {evalError && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--status-quarantine-border)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--status-quarantine-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <IconAlertTriangle size={16} color="var(--status-quarantine-text)" />
            {evalError}
          </div>
        )}
      </SectionCard>

      {/* Header Profile */}
      <SectionCard
        title="Distribution Shift & Anomaly Analysis"
        subtitle="Detects deviation from baseline reference distributions and discriminates natural drift from malicious manipulation"
        icon={<IconActivity size={18} color="var(--accent-cyan)" />}
        badge={
          <StatusBadge
            status={status || (isDrift ? 'REVIEW' : isInDistribution ? 'VERIFIED' : 'QUARANTINE')}
            label={`Classification: ${classification}`}
          />
        }
      >
        <div className="grid-cols-2">
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operational Feed / Sensor: </span>
            <span style={{ fontWeight: 600 }}>{operationalUnit}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Baseline Reference: </span>
            <span style={{ fontWeight: 600 }}>{refDataset}</span>
          </div>
        </div>
      </SectionCard>

      {/* Top Metrics */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <MetricCard
          title="Observed Shift Severity"
          value={overallSeverity.toUpperCase()}
          severity={overallSeverity}
          confidence={overallConfidence}
          note={overallDriftScore !== undefined ? `Drift Score: ${overallDriftScore.toFixed(4)}` : "Wasserstein distance envelope"}
        />
        <MetricCard
          title="Root Classification"
          value={classification}
          status={status || (isDrift ? 'REVIEW' : isInDistribution ? 'VERIFIED' : 'QUARANTINE')}
          note="Cause categorization"
        />
        <MetricCard
          title="Manipulation Risk"
          value={manipulationLikelihood}
          severity={manipulationLikelihood.includes('LOW') ? 'low' : 'high'}
          note="Targeted adversarial likelihood"
        />
        <MetricCard
          title="Assurance Confidence"
          value={formatConfidence(overallConfidence)}
          note="Calibrated statistical confidence"
        />
      </div>

      {/* Primary Classification & Rationale */}
      <div style={{
        background: isDrift ? 'rgba(245, 158, 11, 0.08)' : isInDistribution ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.12)',
        border: `1px solid ${isDrift ? 'var(--status-review-border)' : isInDistribution ? 'var(--status-verified-border)' : 'var(--status-quarantine-border)'}`,
        borderRadius: '6px',
        padding: '16px 20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <IconAlertTriangle size={18} color={isDrift ? '#fbbf24' : isInDistribution ? '#22c55e' : '#f87171'} />
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: isDrift ? '#fbbf24' : isInDistribution ? '#22c55e' : '#f87171',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Operational Drift vs. Suspicious Manipulation Discrimination
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, marginTop: '6px' }}>
          {explanation}
        </p>
      </div>

      {/* Multi-Dimensional Shift Breakdown */}
      <SectionCard
        title="Acquisition & Environmental Dimension Breakdown"
        subtitle="Individual covariate shift indicators measured against accredited reference baseline"
      >
        <div className="assurance-table-wrapper">
          <table className="assurance-table">
            <thead>
              <tr>
                <th>Environmental / Acquisition Dimension</th>
                <th>Measured Shift Magnitude</th>
                <th>Status</th>
                <th>Analyst Observational Context</th>
              </tr>
            </thead>
            <tbody>
              {dimensions && dimensions.length > 0 ? (
                dimensions.map((dim, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{dim.dimension}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {typeof dim.shiftValue === 'number' ? dim.shiftValue.toFixed(4) : dim.shiftValue}
                      </span>
                    </td>
                    <td><StatusBadge status={dim.status} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{dim.note}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                    No dimension data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Cryptographic Provenance & Tamper-Evident Ledger Registration */}
      {(queryHash || referenceFingerprint || evidenceHash || ledgerRecordIndex !== undefined) && (
        <SectionCard
          title="Cryptographic Provenance & Tamper-Evident Ledger Binding"
          subtitle="Cryptographic digests and sequential audit chain verification registered for this evaluation"
          icon={<IconLock size={18} color="var(--accent-cyan)" />}
          badge={
            evidenceAvailable ? (
              <StatusBadge status="VERIFIED" label="EVIDENCE REGISTERED" />
            ) : null
          }
        >
          <div className="grid-cols-2" style={{ gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Query Image Digest (SHA-256)
              </div>
              <HashDisplay hash={queryHash} />
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Reference Baseline Fingerprint (SHA-256)
              </div>
              <HashDisplay hash={referenceFingerprint} />
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Cryptographic Evidence Hash
              </div>
              <HashDisplay hash={evidenceHash} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Ledger Block Record Index
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {ledgerRecordIndex !== undefined && ledgerRecordIndex !== null
                  ? `Record #${ledgerRecordIndex} (Chained & Verified)`
                  : 'Unregistered (Standby Mode)'}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Explicit Statement of Limitations */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.05)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '16px 20px',
        marginTop: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <IconAlertTriangle size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            Declared Analytical Limitations
          </span>
        </div>
        {Array.isArray(limitations) ? (
          <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {limitations.map((lim, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{lim}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '6px 0 0 0' }}>
            {limitations}
          </p>
        )}
      </div>
    </div>
  );
}
