/**
 * SIDEBAR NAVIGATION COMPONENT
 * Contains branding and 8 primary assurance navigation tabs with local SVG icons.
 */
import React from 'react';
import {
  IconShield,
  IconDatabase,
  IconCpu,
  IconCheckCircle,
  IconActivity,
  IconFileText,
  IconGitCommit,
  IconClipboard
} from '../common/Icons';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: <IconShield size={18} /> },
  { id: 'dataset', label: 'Dataset Assurance', icon: <IconDatabase size={18} /> },
  { id: 'model', label: 'Model Assurance', icon: <IconCpu size={18} /> },
  { id: 'inference', label: 'Inference Verification', icon: <IconCheckCircle size={18} /> },
  { id: 'shift', label: 'Distribution Shift', icon: <IconActivity size={18} /> },
  { id: 'evidence', label: 'Evidence', icon: <IconFileText size={18} /> },
  { id: 'audit', label: 'Audit Trail', icon: <IconGitCommit size={18} /> },
  { id: 'report', label: 'Assurance Report', icon: <IconClipboard size={18} /> }
];

export function Sidebar({ currentTab, onSelectTab }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand-title">
          <IconShield size={20} color="var(--accent-cyan)" />
          <span>CV Integrity</span>
        </div>
        <div className="sidebar-brand-sub">
          MoD / Indian Army DGIS (PS 26228)
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>Assurance Layer v1.0.0</div>
        <div style={{ color: 'var(--accent-cyan)', marginTop: '4px' }}>
          Production Node — Active
        </div>
      </div>
    </aside>
  );
}
