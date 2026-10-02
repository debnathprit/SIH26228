/**
 * EVIDENCE VIEWER PAGE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Capability 5: Analyst-Facing Assurance & Evidence Ledger
 * Central ledger of cryptographic, statistical, and behavioral evidence.
 * Displays:
 * - Evidence ID
 * - Affected Asset
 * - Evidence Type
 * - Cryptographic Digest
 * - Timestamp
 * - Severity & Confidence
 * - Verification Source
 * - Plain-language human-readable explanation
 */
import React, { useState, useEffect } from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { HashDisplay } from '../../components/common/HashDisplay';
import { formatTimestamp, formatConfidence, getSeverityClass } from '../../utils/formatters';
import { IconFileText } from '../../components/common/Icons';

export function EvidenceViewerPage({ evidenceList = [], highlightedId }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState(highlightedId || '');

  useEffect(() => {
    if (highlightedId) {
      setSearchTerm(highlightedId);
    }
  }, [highlightedId]);

  const filteredList = evidenceList.filter((item) => {
    const matchesSev = filterSeverity === 'ALL' || item.severity.toLowerCase() === filterSeverity.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="evidence-viewer-page">
      {/* Search and Filter Controls */}
      <SectionCard
        title="Cryptographic & Empirical Evidence Ledger"
        subtitle="Auditable proof records backing pipeline anomaly and integrity dispositions"
        icon={<IconFileText size={18} color="var(--accent-cyan)" />}
        badge={<span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{filteredList.length} Records Shown</span>}
      >
        <div className="grid-cols-3" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filter by Severity</label>
            <select
              className="form-select"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
            <label className="form-label">Search by ID, Asset, Type, or Explanation</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. EVID-DS-001, Sector-7, Backdoor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Evidence Table */}
      <SectionCard title="Active Evidence Records">
        <div className="assurance-table-wrapper">
          <table className="assurance-table">
            <thead>
              <tr>
                <th>Evidence ID</th>
                <th>Affected Asset</th>
                <th>Evidence Type</th>
                <th>Cryptographic Digest (SHA-256)</th>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Source Engine</th>
                <th>Analyst Explanation</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => {
                const isSelected = highlightedId && item.id === highlightedId;
                return (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : undefined
                    }}
                  >
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {item.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.asset}</td>
                    <td>{item.type}</td>
                    <td>
                      <HashDisplay hash={item.hash} lead={6} trail={6} />
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatTimestamp(item.timestamp)}
                    </td>
                    <td>
                      <span className={`severity-tag ${getSeverityClass(item.severity)}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatConfidence(item.confidence)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {item.source}
                    </td>
                    <td style={{ fontSize: '12px', maxWidth: '280px', lineHeight: 1.4 }}>
                      {item.explanation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
