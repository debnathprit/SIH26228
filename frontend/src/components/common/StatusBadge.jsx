/**
 * STATUS BADGE COMPONENT
 * Renders standardized semantic statuses: VERIFIED, REVIEW, QUARANTINE, NOT ASSESSED, ACCEPT
 */
import React from 'react';
import { getStatusClass } from '../../utils/formatters';
import { IconCheckCircle, IconAlertTriangle, IconAlertOctagon, IconLock } from './Icons';

export function StatusBadge({ status, label, showIcon = true }) {
  const displayStatus = label || status || 'NOT ASSESSED';
  const statusClass = getStatusClass(displayStatus);

  const renderIcon = () => {
    if (!showIcon) return null;
    const lower = displayStatus.toLowerCase();
    if (lower.includes('verif') || lower.includes('accept')) {
      return <IconCheckCircle size={12} />;
    }
    if (lower.includes('review') || lower.includes('warn')) {
      return <IconAlertTriangle size={12} />;
    }
    if (lower.includes('quarantine') || lower.includes('tamper') || lower.includes('fail')) {
      return <IconAlertOctagon size={12} />;
    }
    return <IconLock size={12} />;
  };

  return (
    <span className={`status-badge ${statusClass}`}>
      {renderIcon()}
      <span>{displayStatus}</span>
    </span>
  );
}
