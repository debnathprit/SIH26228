/**
 * METRIC CARD COMPONENT
 * Displays an individual metric with optional severity, status, or confidence tag.
 */
import React from 'react';
import { getSeverityClass } from '../../utils/formatters';
import { StatusBadge } from './StatusBadge';

export function MetricCard({ title, value, note, severity, status, confidence }) {
  return (
    <div className="metric-card">
      <div className="metric-title">{title}</div>
      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
        {status && <StatusBadge status={status} />}
        {severity && (
          <span className={`severity-tag ${getSeverityClass(severity)}`}>
            {severity}
          </span>
        )}
      </div>
      {(note || confidence !== undefined) && (
        <div className="metric-note">
          {confidence !== undefined && (
            <span style={{ marginRight: '8px', color: 'var(--text-muted)' }}>
              Confidence: {(confidence * 100).toFixed(0)}%
            </span>
          )}
          {note && <span>{note}</span>}
        </div>
      )}
    </div>
  );
}
