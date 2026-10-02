/**
 * ASSURANCE REPORT PAGE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Formal Analyst-Facing Final Assurance Report
 * Contains:
 * 1. Executive assessment & global disposition
 * 2. Section evaluations (Data, Model, Inference, Shift, Audit)
 * 3. Findings table
 * 4. Supported & unsupported attack classes
 * 5. Declared assumptions & limitations
 * 6. Print / Export capability
 */
import React from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { formatTimestamp, formatConfidence, getSeverityClass } from '../../utils/formatters';
import { IconClipboard, IconPrinter, IconAlertTriangle } from '../../components/common/Icons';

export function AssuranceReportPage({ report }) {
  const {
    reportId,
    dateGenerated,
    classification,
    evaluatingOrganization,
    targetPipeline,
    executiveAssessment,
    sectionEvaluations = [],
    assumptions = [],
    limitations = [],
    supportedAttackClasses = [],
    unsupportedAttackClasses = [],
    signOff
  } = report;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="assurance-report-page">
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Defense Computer Vision Assurance Document
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Official Integrity Assurance Evaluation Report
          </div>
        </div>

        <button className="btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconPrinter size={16} />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Report Header Metadata */}
      <SectionCard
        title={`Report ID: ${reportId}`}
        subtitle={`Classification: ${classification}`}
        icon={<IconClipboard size={18} color="var(--accent-cyan)" />}
        badge={
          <StatusBadge
            status={executiveAssessment.recommendedDisposition}
            label={`FINAL DISPOSITION: ${executiveAssessment.recommendedDisposition}`}
          />
        }
      >
        <div className="grid-cols-2" style={{ fontSize: '12px', gap: '12px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Evaluating Body: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{evaluatingOrganization}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Target Pipeline: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{targetPipeline}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Generation Timestamp: </span>
            <span>{formatTimestamp(dateGenerated)}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Assurance Methodology: </span>
            <span>Empirical, Cryptographic & Behavioral Battery</span>
          </div>
        </div>
      </SectionCard>

      {/* Executive Assessment */}
      <SectionCard
        title="1. Executive Assessment & Disposition"
        subtitle="Analyst synthesis of all upstream pipeline evidence"
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
            {executiveAssessment.summary}
          </p>
        </div>

        <div className="grid-cols-3">
          <MetricCard
            title="Final Disposition"
            value={executiveAssessment.recommendedDisposition}
            status={executiveAssessment.recommendedDisposition}
            note="Analyst operational recommendation"
          />
          <MetricCard
            title="Assurance Severity"
            value={executiveAssessment.overallSeverity.toUpperCase()}
            severity={executiveAssessment.overallSeverity}
            note="Maximum observed risk tier"
          />
          <MetricCard
            title="Overall Confidence"
            value={formatConfidence(executiveAssessment.overallConfidence)}
            note="Calibrated evidence weight"
          />
        </div>
      </SectionCard>

      {/* Section Evaluations */}
      <SectionCard
        title="2. Section-by-Section Lifecycle Evaluations"
        subtitle="Detailed risk findings across data, model, inference, shift, and audit"
      >
        <div className="assurance-table-wrapper">
          <table className="assurance-table">
            <thead>
              <tr>
                <th>Pillar / Lifecycle Area</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Key Findings & Technical Rationale</th>
              </tr>
            </thead>
            <tbody>
              {sectionEvaluations.map((sec, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{sec.section}</td>
                  <td><StatusBadge status={sec.status} /></td>
                  <td>
                    <span className={`severity-tag ${getSeverityClass(sec.severity)}`}>
                      {sec.severity}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{formatConfidence(sec.confidence)}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {sec.findings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Attack Classes: Supported vs Unsupported */}
      <div className="grid-cols-2" style={{ marginBottom: '20px' }}>
        {/* Supported Attack Classes */}
        <SectionCard
          title="3. Supported Attack Vectors"
          subtitle="Classes within scope of current assurance evaluation"
        >
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {supportedAttackClasses.map((item, i) => (
              <li key={i}>
                <strong style={{ color: 'var(--text-primary)' }}>{item}</strong>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Unsupported Attack Classes */}
        <SectionCard
          title="4. Declared Out-of-Scope Threat Vectors"
          subtitle="Explicit boundary: threats not covered by this layer"
        >
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unsupportedAttackClasses.map((item, i) => (
              <li key={i}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Assumptions and Limitations */}
      <div className="grid-cols-2" style={{ marginBottom: '20px' }}>
        <SectionCard
          title="5. Operational Assumptions"
          subtitle="Preconditions required for assurance validity"
        >
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assumptions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="6. Declared System Limitations"
          subtitle="Known boundaries and residual uncertainties"
        >
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {limitations.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Analyst Sign-off */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px'
      }}>
        <div>
          <div>Prepared By: <strong>{signOff.analystName}</strong></div>
          <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Reviewer: {signOff.reviewedBy}</div>
        </div>
        <div>
          <StatusBadge status="REVIEW" label={signOff.status} />
        </div>
      </div>
    </div>
  );
}
