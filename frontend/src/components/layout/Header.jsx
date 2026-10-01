/**
 * APP HEADER COMPONENT
 * Displays current page title, air-gapped status, and global system disposition.
 */
import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { IconLock } from '../common/Icons';

export function Header({ currentTitle, globalDisposition = 'REVIEW' }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="page-title-header">{currentTitle}</h1>
      </div>

      <div className="header-right">
        {/* Air-gapped offline indicator */}
        <div className="air-gap-pill" title="System running entirely local & air-gapped without remote dependencies">
          <span className="air-gap-dot" />
          <IconLock size={12} />
          <span>Air-Gapped / Offline</span>
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
