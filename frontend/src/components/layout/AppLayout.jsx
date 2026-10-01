/**
 * APP LAYOUT SHELL
 * Integrates Sidebar, Header, air-gap banner, mock data notice, and content stage.
 */
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { IconAlertTriangle } from '../common/Icons';

export function AppLayout({ currentTab, onSelectTab, currentTitle, globalDisposition, isMock = true, children }) {
  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

      <div className="app-main-wrapper">
        <Header currentTitle={currentTitle} globalDisposition={globalDisposition} />

        <main className="app-content">
          {/* Explicit Mock Data / Demo Banner */}
          {isMock && (
            <div className="mock-notice-banner" role="status">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="mock-notice-badge">DEMO / MOCK DATA</span>
                <span>
                  Currently displaying simulated offline assurance data for frontend development & presentation. 
                  Live evaluation will be performed once Person A backend endpoints are active.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <IconAlertTriangle size={14} color="#f59e0b" />
                <span>Simulated Mode</span>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
