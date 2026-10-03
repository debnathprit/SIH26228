/**
 * DATASET ASSURANCE PAGE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Capability 1: Training-Data Integrity
 * Multi-format dataset analysis (YOLO, COCO):
 * - Trigger injection
 * - Label flipping & systematic mislabeling
 * - Near-duplicate flooding
 * - Out-of-distribution insertion
 * - Contributor / source-level risk aggregation
 */
import React, { useState } from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { DATASET_FORMATS } from '../../utils/constants';
import { formatConfidence, getSeverityClass } from '../../utils/formatters';
import { IconDatabase, IconAlertTriangle } from '../../components/common/Icons';

export function DatasetAssurancePage({ data, onNavigateToEvidence }) {
  const [selectedFormat, setSelectedFormat] = useState(DATASET_FORMATS.YOLO);
  const [uploadedFileName, setUploadedFileName] = useState(data.datasetName);

  const {
    totalSamples,
    classesCount,
    contributorsCount,
    overallDisposition,
    overallSeverity,
    overallConfidence,
    recommendation,
    findings,
    contributorRisk
  } = data;

  const handleSimulatedUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="dataset-assurance-page">
      {/* Upload and Configuration Header */}
      <SectionCard
        title="Dataset Ingestion & Integrity Parameters"
        subtitle="Evaluates multi-contributor datasets for poisoning, label anomalies, and trigger patterns"
        icon={<IconDatabase size={18} color="var(--accent-cyan)" />}
        badge={<StatusBadge status={overallDisposition} label={`Disposition: ${overallDisposition}`} />}
      >
        <div className="grid-cols-3" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Dataset Format Specification</label>
            <select
              className="form-select"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value={DATASET_FORMATS.YOLO}>YOLO (images/ + labels/*.txt)</option>
              <option value={DATASET_FORMATS.COCO}>COCO JSON (annotations/instances_*.json)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Dataset Archive (ZIP / Tarball)</label>
            <input
              type="file"
              className="form-input"
              accept=".zip,.tar,.gz"
              onChange={handleSimulatedUpload}
            />
          </div>

          <div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Run Integrity Assessment
            </button>
          </div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Active Dataset: <strong>{uploadedFileName}</strong> | Format: <strong>{selectedFormat}</strong> | Air-Gapped Mode: Active
        </div>
      </SectionCard>

      {/* Dataset Overview Metrics */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <MetricCard
          title="Total Samples"
          value={totalSamples.toLocaleString()}
          note={`${classesCount} Target Object Classes`}
        />
        <MetricCard
          title="Contributing Sources"
          value={contributorsCount}
          note="Aggregated Source Units"
        />
        <MetricCard
          title="Integrity Severity"
          value={overallSeverity.toUpperCase()}
          severity={overallSeverity}
          confidence={overallConfidence}
        />
        <MetricCard
          title="Recommended Disposition"
          value={overallDisposition}
          status={overallDisposition}
          note="Analyst action posture"
        />
      </div>

      {/* Analyst Action Recommendation */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid var(--status-review-border)',
        borderRadius: '6px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <IconAlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
            Analyst Action Recommendation:
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
            {recommendation}
          </div>
        </div>
      </div>

      {/* Specific Findings Grid */}
      <div className="grid-cols-2" style={{ marginBottom: '20px' }}>
        {/* Near-Duplicate Flooding */}
        <SectionCard
          title="Near-Duplicate Flooding Analysis"
          subtitle="Detects artificial dataset skew & density poisoning"
          badge={<span className={`severity-tag ${getSeverityClass(findings.nearDuplicates.severity)}`}>{findings.nearDuplicates.severity}</span>}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {findings.nearDuplicates.count} samples ({findings.nearDuplicates.percentage})
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {findings.nearDuplicates.details}
          </p>
          <button
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px' }}
            onClick={() => onNavigateToEvidence(findings.nearDuplicates.evidenceId)}
          >
            View Evidence #{findings.nearDuplicates.evidenceId}
          </button>
        </SectionCard>

        {/* Label Inversion & Mislabelling */}
        <SectionCard
          title="Label Flipping & Anomaly Detection"
          subtitle="Identifies label inversions and systematic misannotations"
          badge={<span className={`severity-tag ${getSeverityClass(findings.labelAnomalies.severity)}`}>{findings.labelAnomalies.severity}</span>}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {findings.labelAnomalies.count} samples ({findings.labelAnomalies.percentage})
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {findings.labelAnomalies.details}
          </p>
          <button
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px' }}
            onClick={() => onNavigateToEvidence(findings.labelAnomalies.evidenceId)}
          >
            View Evidence #{findings.labelAnomalies.evidenceId}
          </button>
        </SectionCard>

        {/* Trigger / Backdoor Injection */}
        <SectionCard
          title="Trigger / Backdoor Suspicion"
          subtitle="Spectral and spatial frequency patch artifact scan"
          badge={<span className={`severity-tag ${getSeverityClass(findings.triggerBackdoorSuspicion.severity)}`}>{findings.triggerBackdoorSuspicion.severity}</span>}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-quarantine-text)' }}>
              {findings.triggerBackdoorSuspicion.count} samples ({findings.triggerBackdoorSuspicion.percentage})
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {findings.triggerBackdoorSuspicion.details}
          </p>
          <button
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px' }}
            onClick={() => onNavigateToEvidence(findings.triggerBackdoorSuspicion.evidenceId)}
          >
            View Evidence #{findings.triggerBackdoorSuspicion.evidenceId}
          </button>
        </SectionCard>

        {/* Out-of-Distribution Insertion */}
        <SectionCard
          title="Out-of-Distribution (OOD) Insertion"
          subtitle="Feature-space outlier analysis"
          badge={<span className={`severity-tag ${getSeverityClass(findings.oodSamples.severity)}`}>{findings.oodSamples.severity}</span>}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {findings.oodSamples.count} samples ({findings.oodSamples.percentage})
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {findings.oodSamples.details}
          </p>
          <button
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px' }}
            onClick={() => onNavigateToEvidence(findings.oodSamples.evidenceId)}
          >
            View Evidence #{findings.oodSamples.evidenceId}
          </button>
        </SectionCard>
      </div>

      {/* Contributor / Source-Level Risk Aggregation */}
      <SectionCard
        title="Contributor / Source-Level Risk Aggregation"
        subtitle="Aggregates individual sample anomalies into contributing unit trustworthiness profiles"
        badge={<span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Multi-Contributor Pipeline</span>}
      >
        <div className="assurance-table-wrapper">
          <table className="assurance-table">
            <thead>
              <tr>
                <th>Contributor / Source ID</th>
                <th>Contributed Samples</th>
                <th>Flagged Anomalies</th>
                <th>Source Risk Level</th>
                <th>Recommended Disposition</th>
              </tr>
            </thead>
            <tbody>
              {contributorRisk.map((contributor) => (
                <tr key={contributor.id}>
                  <td style={{ fontWeight: 600 }}>{contributor.id}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{contributor.samples.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: contributor.rejected > 50 ? 'var(--status-quarantine-text)' : 'inherit' }}>
                    {contributor.rejected}
                  </td>
                  <td>
                    <span className={`severity-tag ${contributor.riskScore.toLowerCase() === 'high' ? 'sev-high' : 'sev-low'}`}>
                      {contributor.riskScore}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={contributor.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
