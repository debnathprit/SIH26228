/**
 * OVERVIEW DASHBOARD PAGE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Displays the complete Computer Vision lifecycle assurance status across the five core capabilities:
 * 1. Training-Data Integrity
 * 2. Model Integrity
 * 3. Inference Provenance & Output Integrity
 * 4. Distribution Shift & Anomaly
 * 5. Tamper-Evident Audit Trail & Governance
 */
import React from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { formatConfidence, getSeverityClass } from '../../utils/formatters';
import {
  IconShield,
  IconDatabase,
  IconCpu,
  IconCheckCircle,
  IconActivity,
  IconGitCommit,
  IconAlertTriangle
} from '../../components/common/Icons';

export function OverviewPage({ data, onNavigate }) {
  const { globalDisposition, globalReason, evidenceCount, unresolvedFlags, pillars = [] } = data;

  const getPillarIcon = (id) => {
    switch (id) {
      case 'dataset': return <IconDatabase size={18} />;
      case 'model': return <IconCpu size={18} />;
      case 'inference': return <IconCheckCircle size={18} />;
      case 'shift': return <IconActivity size={18} />;
      case 'audit': return <IconGitCommit size={18} />;
      default: return <IconShield size={18} />;
    }
  };

  return (
    <div className="overview-page">
      {/* Top Lifecycle Executive Banner */}
      <SectionCard
        title="Pipeline Integrity Assurance Lifecycle"
        subtitle="End-to-end cryptographic and behavioral verification across multi-contributor CV assets"
        icon={<IconShield size={20} color="var(--accent-cyan)" />}
        badge={<StatusBadge status={globalDisposition} label={`OVERALL DISPOSITION: ${globalDisposition}`} />}
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>Assessment Finding: </strong> {globalReason}
          </p>
          <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <em>Note: The disposition represents a rigorous evidentiary assessment based on evaluated artifacts and declared constraints, not an absolute guarantee of invulnerability.</em>
          </div>
        </div>

        {/* Lifecycle Flow Indicators */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          overflowX: 'auto',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase'
        }}>
          <span>Contributed Data</span>
          <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
          <span style={{ color: 'var(--text-primary)' }}>Data Integrity</span>
          <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
          <span>Model Registry</span>
          <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
          <span style={{ color: 'var(--text-primary)' }}>Model Integrity</span>
          <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
          <span style={{ color: 'var(--text-primary)' }}>Inference Binding</span>
          <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
          <span style={{ color: 'var(--text-primary)' }}>Shift Detection</span>
          <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
          <span style={{ color: 'var(--text-primary)' }}>Audit Trail</span>
          <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
          <span style={{ color: 'var(--status-verified-text)' }}>Assurance Report</span>
        </div>
      </SectionCard>

      {/* High-Level Metrics Summary */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <MetricCard
          title="Overall Disposition"
          value={globalDisposition}
          status={globalDisposition}
          note="Recommended analyst posture"
        />
        <MetricCard
          title="Active Evidence Records"
          value={evidenceCount}
          note="Cryptographic & behavioral proofs"
        />
        <MetricCard
          title="Unresolved Flags"
          value={unresolvedFlags}
          severity={unresolvedFlags > 0 ? 'medium' : 'low'}
          note="Requires analyst review"
        />
        <MetricCard
          title="Assurance Mode"
          value="Air-Gapped"
          note="Zero external network dependencies"
        />
      </div>

      {/* Five Core Lifecycle Pillars Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Five Core Capability Assessments
        </div>

        <div className="grid-cols-2">
          {pillars.map((pillar) => (
            <SectionCard
              key={pillar.id}
              title={pillar.title}
              subtitle={pillar.asset}
              icon={getPillarIcon(pillar.id)}
              badge={<StatusBadge status={pillar.status} />}
              actions={
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  onClick={() => onNavigate(pillar.id === 'dataset' ? 'dataset' : pillar.id === 'model' ? 'model' : pillar.id === 'inference' ? 'inference' : pillar.id === 'shift' ? 'shift' : 'audit')}
                >
                  Inspect Pillar
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {pillar.explanation}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>
                      Severity: <span className={`severity-tag ${getSeverityClass(pillar.severity)}`}>{pillar.severity}</span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Confidence: <strong>{formatConfidence(pillar.confidence)}</strong>
                    </span>
                  </div>
                  <div>
                    {pillar.evidenceAvailable ? (
                      <span style={{ color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: 600 }}>
                        Evidence Linked
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        No Evidence
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
