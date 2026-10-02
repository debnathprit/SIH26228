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
import { API_BASE_URL } from '../../services/api';

export function OverviewPage({
  data = {},
  onNavigate,
  backendHealth = null,
  systemOverview = null,
  isBackendConnected = false,
  assuranceLoading = false,
  assuranceError = null
}) {
  // Safe fallback values from authoritative App-level data prop
  const globalDisposition = data.globalDisposition || 'NOT ASSESSED';
  const globalReason = data.globalReason || 'Assurance summary unavailable.';
  const evidenceCount = data.evidenceCount ?? 0;
  const unresolvedFlags = data.unresolvedFlags ?? 0;
  const pillars = data.pillars || [];

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
      {/* Loading & Error Notice Banners */}
      {assuranceLoading && (
        <div style={{
          padding: '8px 12px',
          marginBottom: '12px',
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          Loading live assurance summary...
        </div>
      )}
      {assuranceError && (
        <div style={{
          padding: '8px 12px',
          marginBottom: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--status-quarantine-border)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--status-quarantine-text)'
        }}>
          Unable to load live assurance summary. Using available fallback.
        </div>
      )}

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

      {/* Live Backend Subsystem Inventory (Phase 3B Step 1 Integration) */}
      <SectionCard
        title={`Backend Subsystems: ${systemOverview?.project || 'Trusted Computer Vision Assurance'}`}
        subtitle={`FastAPI Service at ${API_BASE_URL} — API Version: ${systemOverview?.api_version || 'v1'}`}
        icon={<IconCpu size={20} color="var(--accent-cyan)" />}
        badge={
          isBackendConnected ? (
            <StatusBadge status="VERIFIED" label={`API v${backendHealth?.version || '1.0.0'} ONLINE`} />
          ) : (
            <StatusBadge status="REVIEW" label="OFFLINE (DEMO MODE)" />
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Verified operational components deployed in the backend execution environment:
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px'
          }}>
            {systemOverview?.components ? (
              Object.entries(systemOverview.components).map(([key, isActive]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
                    <span style={{
                      color: isActive ? 'var(--status-verified-text)' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '11px'
                    }}>
                      {isActive ? '● ACTIVE' : '○ INACTIVE'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                Backend service unreachable. Using local simulation fallback.
              </div>
            )}
          </div>
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
