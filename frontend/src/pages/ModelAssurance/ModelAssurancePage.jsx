/**
 * MODEL ASSURANCE PAGE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Capability 2: Model Integrity
 * - Multi-format support: ONNX, PyTorch (.pt/.pth), TorchScript
 * - Cryptographic weight tensor digest verification
 * - White-box vs Black-box assessment with graceful fallback
 * - Substitution detection
 * - Backdoor-like behavior (trigger search, activation statistics)
 * - Explicit statements of confidence, assumptions, and limitations
 */
import React, { useState } from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { HashDisplay } from '../../components/common/HashDisplay';
import { MODEL_FORMATS, ACCESS_TYPES } from '../../utils/constants';
import { formatConfidence } from '../../utils/formatters';
import { IconCpu, IconAlertTriangle } from '../../components/common/Icons';

export function ModelAssurancePage({ data, onNavigateToEvidence }) {
  const [selectedFormat, setSelectedFormat] = useState(MODEL_FORMATS.ONNX);
  const [accessMode, setAccessMode] = useState(data.accessType || ACCESS_TYPES.WHITE_BOX);

  const {
    modelName,
    version,
    weightDigest,
    expectedDigest,
    architecture,
    overallDisposition,
    confidence,
    limitations,
    checks = []
  } = data;

  const isDigestMatch = weightDigest === expectedDigest;

  return (
    <div className="model-assurance-page">
      {/* Model Ingestion & Parameters */}
      <SectionCard
        title="Model Ingestion & Access Profile"
        subtitle="Evaluates trained neural network weights for substitution, parameter tampering, and backdoor triggers"
        icon={<IconCpu size={18} color="var(--accent-cyan)" />}
        badge={<StatusBadge status={overallDisposition} label={`Disposition: ${overallDisposition}`} />}
      >
        <div className="grid-cols-3" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Model Runtime Format</label>
            <select
              className="form-select"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value={MODEL_FORMATS.ONNX}>ONNX (.onnx Open Neural Network Exchange)</option>
              <option value={MODEL_FORMATS.PYTORCH}>PyTorch Weights (.pt / .pth)</option>
              <option value={MODEL_FORMATS.TORCHSCRIPT}>TorchScript Archive (.pt)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Evaluator Access Tier</label>
            <select
              className="form-select"
              value={accessMode}
              onChange={(e) => setAccessMode(e.target.value)}
            >
              <option value={ACCESS_TYPES.WHITE_BOX}>WHITE-BOX (Weights, Biases, Activation Access)</option>
              <option value={ACCESS_TYPES.BLACK_BOX}>BLACK-BOX (Inference Query Interface Only)</option>
            </select>
          </div>

          <div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Execute Integrity Battery
            </button>
          </div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Target Artifact: <strong>{modelName}</strong> (v{version}) | Architecture: <strong>{architecture}</strong>
        </div>
      </SectionCard>

      {/* Model Key Metrics */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <MetricCard
          title="Weight Integrity"
          value={isDigestMatch ? 'MATCH' : 'MISMATCH'}
          status={isDigestMatch ? 'VERIFIED' : 'QUARANTINE'}
          note="SHA-256 tensor digest check"
        />
        <MetricCard
          title="Access Mode"
          value={accessMode}
          note={accessMode === ACCESS_TYPES.WHITE_BOX ? 'Full parameter scrutiny' : 'Black-box fallback mode'}
        />
        <MetricCard
          title="Assurance Confidence"
          value={formatConfidence(confidence)}
          note="Calibrated detection confidence"
        />
        <MetricCard
          title="Recommended Action"
          value={overallDisposition}
          status={overallDisposition}
          note="Analyst disposition"
        />
      </div>

      {/* Cryptographic Weight Digest Verification */}
      <SectionCard
        title="Cryptographic Weight Digest Comparison"
        subtitle="Verification against the defense-accredited registry"
      >
        <div className="assurance-table-wrapper" style={{ marginBottom: '10px' }}>
          <table className="assurance-table">
            <thead>
              <tr>
                <th>Digest Attribute</th>
                <th>Cryptographic Value (SHA-256)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Extracted Model Digest</td>
                <td><HashDisplay hash={weightDigest} lead={12} trail={12} /></td>
                <td><StatusBadge status={isDigestMatch ? 'VERIFIED' : 'QUARANTINE'} /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Registry Benchmark Digest</td>
                <td><HashDisplay hash={expectedDigest} lead={12} trail={12} /></td>
                <td><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trusted Baseline</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          <em>Critical Constraint: Matching the cryptographic digest ensures identical serialization, but does NOT alone prove absence of latent backdoors injected prior to registry sign-off.</em>
        </p>
      </SectionCard>

      {/* Behavioral & Backdoor Check Results */}
      <SectionCard
        title="Behavioral Assessment & Backdoor Analysis Battery"
        subtitle="Evaluates latent triggers, weight distribution outliers, and activation anomalies"
        badge={
          accessMode === ACCESS_TYPES.BLACK_BOX ? (
            <span className="severity-tag sev-medium">BLACK-BOX FALLBACK ACTIVE</span>
          ) : null
        }
      >
        {accessMode === ACCESS_TYPES.BLACK_BOX && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid var(--status-review-border)',
            borderRadius: '4px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#fde68a'
          }}>
            <strong>Notice on Black-Box Fallback:</strong> White-box parameter analysis and internal activation statistics are unavailable in black-box mode. Assessment relies exclusively on reference query battery perturbation responses.
          </div>
        )}

        <div className="assurance-table-wrapper">
          <table className="assurance-table">
            <thead>
              <tr>
                <th>Evaluation Check</th>
                <th>Result</th>
                <th>Status</th>
                <th>Technical Finding Details</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{item.check}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {item.result}
                    </span>
                  </td>
                  <td><StatusBadge status={item.status} /></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{item.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Explicit Limitations Panel */}
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
            Declared Assurance Assumptions & Limitations
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {limitations}
        </p>
      </div>
    </div>
  );
}
