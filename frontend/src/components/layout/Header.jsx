/**
 * APP HEADER COMPONENT
 * Displays current page title, air-gapped status, and global system disposition.
 */
import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { IconLock } from '../common/Icons';
import { API_BASE_URL } from '../../services/api';

export function Header({ currentTitle, globalDisposition = 'REVIEW', backendHealth = null, isBackendConnected = false }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="page-title-header">{currentTitle}</h1>
      </div>

      <div className="header-right">
        {/* Backend connectivity status */}
        <div
          className="air-gap-pill"
          style={{
            borderColor: isBackendConnected ? 'var(--status-verified-border)' : 'var(--border-subtle)',
            background: isBackendConnected ? 'var(--status-verified-bg)' : 'transparent'
          }}
          title={isBackendConnected ? `Backend API v${backendHealth?.version || '1.0.0'} online (${API_BASE_URL})` : `Backend unreachable (${API_BASE_URL}). Operating in offline demo fallback.`}
        >
          <span
            className="air-gap-dot"
            style={{ background: isBackendConnected ? 'var(--status-verified-text)' : 'var(--status-review-text)' }}
          />
          <span style={{ color: isBackendConnected ? 'var(--status-verified-text)' : 'var(--text-muted)' }}>
            {isBackendConnected ? `API v${backendHealth?.version || '1.0.0'} Online` : 'API Offline'}
          </span>
        </div>

        {/* Air-gapped offline indicator */}
        <div className="air-gap-pill" title="System running entirely local & air-gapped without remote dependencies">
          <span className="air-gap-dot" />
          <IconLock size={12} />
          <span>Air-Gapped</span>
        </div>

        {/* Global disposition badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Disposition:
          </span>
          <StatusBadge status={globalDisposition} />
        </div>
      </div>
    </header>
  );
}
