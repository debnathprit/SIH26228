/**
 * DISTRIBUTION SHIFT AND ANOMALY PAGE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Capability 4: Distribution Shift and Anomaly
 * - Material deviation from declared reference distribution
 * - Evaluates: Terrain, Season, Sensor, Illumination, Acquisition conditions
 * - Distinguishes operational drift from suspicious optical manipulation
 * - Declares calibrated risk, confidence, and boundaries
 */
import React from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { formatConfidence, getSeverityClass } from '../../utils/formatters';
import { IconActivity, IconAlertTriangle } from '../../components/common/Icons';

export function DistributionShiftPage({ data }) {
  const {
    operationalUnit,
    referenceDataset,
    overallSeverity,
    overallConfidence,
    classification,
    manipulationLikelihood,
    explanation,
    dimensions = [],
    limitations
  } = data;

  const isDrift = classification === 'OPERATIONAL DRIFT';

  return (
    <div className="distribution-shift-page">
      {/* Header Profile */}
      <SectionCard
        title="Distribution Shift & Anomaly Analysis"
        subtitle="Detects deviation from baseline reference distributions and discriminates natural drift from malicious manipulation"
        icon={<IconActivity size={18} color="var(--accent-cyan)" />}
        badge={
          <StatusBadge
            status={isDrift ? 'REVIEW' : 'QUARANTINE'}
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
            <span style={{ fontWeight: 600 }}>{referenceDataset}</span>
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
          note="Wasserstein distance envelope"
        />
        <MetricCard
          title="Root Classification"
          value={classification}
          status={isDrift ? 'REVIEW' : 'QUARANTINE'}
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
        background: isDrift ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.12)',
        border: `1px solid ${isDrift ? 'var(--status-review-border)' : 'var(--status-quarantine-border)'}`,
        borderRadius: '6px',
        padding: '16px 20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <IconAlertTriangle size={18} color={isDrift ? '#fbbf24' : '#f87171'} />
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: isDrift ? '#fbbf24' : '#f87171',
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
              {dimensions.map((dim, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{dim.dimension}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {dim.shiftValue}
                    </span>
                  </td>
                  <td><StatusBadge status={dim.status} /></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{dim.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

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
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {limitations}
        </p>
      </div>
    </div>
  );
}
