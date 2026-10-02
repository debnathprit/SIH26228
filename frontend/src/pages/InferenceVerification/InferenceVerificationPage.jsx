/**
 * INFERENCE VERIFICATION PAGE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Capability 3: Inference Provenance and Output Integrity
 * Cryptographically binds:
 *   Input Image Hash
 *   + Model Digest
 *   + Preprocessing Configuration Digest
 *   + Inference Configuration Digest
 *   + Output Hash
 *   = VERIFIABLE INFERENCE RECORD
 * Detects post-hoc alteration, substitution, and replay attacks.
 */
import React, { useState } from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { HashDisplay } from '../../components/common/HashDisplay';
import { formatTimestamp } from '../../utils/formatters';
import { IconCheckCircle, IconLock, IconAlertOctagon } from '../../components/common/Icons';

export function InferenceVerificationPage({ data }) {
  const [selectedRecordId, setSelectedRecordId] = useState(data.recordId);

  const {
    recordId,
    timestamp,
    nonce,
    sequenceNumber,
    provenanceStatus,
    tamperingDetected,
    replayDetected,
    overallDisposition,
    binding,
    preprocessingDetails,
    inferenceDetails,
    outputPrediction
  } = data;

  return (
    <div className="inference-verification-page">
      {/* Header Profile */}
      <SectionCard
        title="Inference Provenance & Cryptographic Binding"
        subtitle="Verifies authentic execution binding across input imagery, model weights, pipeline parameters, and predictions"
        icon={<IconCheckCircle size={18} color="var(--accent-cyan)" />}
        badge={<StatusBadge status={overallDisposition} label={`Disposition: ${overallDisposition}`} />}
      >
        <div className="grid-cols-4" style={{ alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inference Record</div>
            <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{recordId}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatTimestamp(timestamp)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Anti-Replay Nonce</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{nonce}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sequence Nonce</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>#{sequenceNumber}</div>
          </div>
        </div>
      </SectionCard>

      {/* Top Status Metrics */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <MetricCard
          title="Provenance Verification"
          value={provenanceStatus}
          status={provenanceStatus}
          note="HMAC-SHA256 signature chain"
        />
        <MetricCard
          title="Tamper Detection"
          value={tamperingDetected ? 'TAMPERED' : 'UNALTERED'}
          status={tamperingDetected ? 'QUARANTINE' : 'VERIFIED'}
          note="Output tensor integrity"
        />
        <MetricCard
          title="Replay Detection"
          value={replayDetected ? 'REPLAY DETECTED' : 'FRESH RECORD'}
          status={replayDetected ? 'QUARANTINE' : 'VERIFIED'}
          note="Nonce freshness check"
        />
        <MetricCard
          title="Disposition"
          value={overallDisposition}
          status={overallDisposition}
          note="Downstream consumer advice"
        />
      </div>

      {/* Visual Representation of Cryptographic Binding */}
      <SectionCard
        title="Verifiable Cryptographic Binding Chain"
        subtitle="Every inference output is mathematically locked to its origin pipeline components"
      >
        <div className="crypto-pipeline">
          {/* Node 1: Input */}
          <div className="pipeline-node">
            <div className="pipeline-node-title">1. Input Image</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Raw Pixels SHA-256</div>
            <HashDisplay hash={binding.inputImageHash} lead={6} trail={6} />
          </div>

          <div className="pipeline-operator">+</div>

          {/* Node 2: Model */}
          <div className="pipeline-node">
            <div className="pipeline-node-title">2. Model Digest</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Weights Registry Digest</div>
            <HashDisplay hash={binding.modelDigest} lead={6} trail={6} />
          </div>

          <div className="pipeline-operator">+</div>

          {/* Node 3: Preprocessing */}
          <div className="pipeline-node">
            <div className="pipeline-node-title">3. Preprocessing Config</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Norm/Resize Parameters</div>
            <HashDisplay hash={binding.preprocessingConfigDigest} lead={6} trail={6} />
          </div>

          <div className="pipeline-operator">+</div>

          {/* Node 4: Inference Config */}
          <div className="pipeline-node">
            <div className="pipeline-node-title">4. Inference Config</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Thresholds & Flags</div>
            <HashDisplay hash={binding.inferenceConfigDigest} lead={6} trail={6} />
          </div>

          <div className="pipeline-operator">+</div>

          {/* Node 5: Output */}
          <div className="pipeline-node">
            <div className="pipeline-node-title">5. Output Tensor</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Bounding Boxes / Classes</div>
            <HashDisplay hash={binding.outputHash} lead={6} trail={6} />
          </div>

          <div className="pipeline-operator">=</div>

          {/* Result Node */}
          <div className="pipeline-result">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <IconLock size={14} color="var(--accent-cyan)" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                Verifiable Inference Record
              </span>
            </div>
            <HashDisplay hash={binding.verifiableRecordDigest} lead={10} trail={10} />
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              Any alteration to input, weights, thresholds, or output invalidates this digest.
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Details Split: Pipeline Parameters & Detections */}
      <div className="grid-cols-2">
        {/* Preprocessing & Inference Parameters */}
        <SectionCard
          title="Bound Execution Parameters"
          subtitle="Exact runtime environment captured in provenance record"
        >
          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Input Resolution: </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{preprocessingDetails.resolution}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Color Normalization: </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{preprocessingDetails.colorSpace}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Confidence Threshold: </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{inferenceDetails.confThreshold}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>IOU Threshold: </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{inferenceDetails.iouThreshold}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>FP16 Accelerated Mode: </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{inferenceDetails.fp16Mode ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </SectionCard>

        {/* Prediction Detections Sealed in Record */}
        <SectionCard
          title="Sealed Inference Outputs"
          subtitle="Objects and bounding coordinates protected from post-hoc tampering"
        >
          <div className="assurance-table-wrapper">
            <table className="assurance-table">
              <thead>
                <tr>
                  <th>Detected Class</th>
                  <th>Confidence</th>
                  <th>Protected Bounding Box [x1, y1, x2, y2]</th>
                </tr>
              </thead>
              <tbody>
                {outputPrediction.detectedObjects.map((obj, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{obj.class}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{(obj.confidence * 100).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>[{obj.bbox.join(', ')}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
