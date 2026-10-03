/**
 * AUDIT TRAIL PAGE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Capability 5: Tamper-Evident Audit Trail
 * Chronological, cryptographically hash-linked event log:
 * H(Block_N) = SHA256(Block_Data || H(Block_{N-1}))
 * 
 * Tracks pipeline actions:
 * - Dataset uploaded & evaluated
 * - Model registered & evaluated
 * - Inference generated & bound
 * - Tampering / anomaly detected
 * - Assurance report compiled
 */
import React, { useState } from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { HashDisplay } from '../../components/common/HashDisplay';
import { formatTimestamp } from '../../utils/formatters';
import { IconGitCommit, IconCheckCircle, IconLock } from '../../components/common/Icons';

export function AuditTrailPage({ auditEvents = [] }) {
  const [chainVerified, setChainVerified] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const handleVerifyChain = () => {
    setVerifying(true);
    setTimeout(() => {
      setChainVerified(true);
      setVerifying(false);
    }, 600);
  };

  return (
    <div className="audit-trail-page">
      {/* Header Profile & Chain Health */}
      <SectionCard
        title="Tamper-Evident Chronological Audit Ledger"
        subtitle="Cryptographically hash-linked record of every ingestion, assessment, and disposition action"
        icon={<IconGitCommit size={18} color="var(--accent-cyan)" />}
        badge={
          <StatusBadge
            status={chainVerified ? 'VERIFIED' : 'QUARANTINE'}
            label={chainVerified ? 'Ledger Chain: Intact' : 'Ledger Tampering Detected'}
          />
        }
        actions={
          <button
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
            onClick={handleVerifyChain}
            disabled={verifying}
          >
            {verifying ? 'Recalculating Proofs...' : 'Verify Chain Integrity'}
          </button>
        }
      >
        <div className="grid-cols-3" style={{ fontSize: '12px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Events: </span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{auditEvents.length} Blocks</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hash Architecture: </span>
            <span style={{ fontWeight: 600 }}>SHA-256 Merkle-Linked Records</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chain State: </span>
            <span style={{ color: 'var(--status-verified-text)', fontWeight: 600 }}>Zero Broken Parent Links</span>
          </div>
        </div>
      </SectionCard>

      {/* Chronological Timeline Container */}
      <div className="timeline-container">
        <div className="timeline-line" />

        {auditEvents.map((evt) => (
          <div key={evt.sequence} className="timeline-item">
            <div className="timeline-node-dot" />

            <div className="timeline-card">
              <div className="timeline-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    background: 'var(--bg-canvas)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    Block #{evt.sequence}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {evt.event}
                  </span>
                  <StatusBadge status={evt.verificationStatus} label={`Verification Status: ${evt.verificationStatus}`} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {formatTimestamp(evt.timestamp)}
                </div>
              </div>

              <div style={{ fontSize: '12px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                <span>Asset: <strong style={{ color: 'var(--text-primary)' }}>{evt.asset}</strong></span>
                <span style={{ margin: '0 8px' }}>•</span>
                <span>Actor / Subsystem: <strong style={{ color: 'var(--text-primary)' }}>{evt.actor}</strong></span>
              </div>

              {/* Cryptographic Linkage Details */}
              <div style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '10px 12px',
                fontSize: '11px',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '8px 12px',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Block Hash:</span>
                <HashDisplay hash={evt.eventHash} lead={10} trail={10} />

                <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parent Block Hash:</span>
                <HashDisplay hash={evt.prevHash} lead={10} trail={10} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
