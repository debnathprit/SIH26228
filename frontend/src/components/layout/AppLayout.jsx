/**
 * APP LAYOUT SHELL
 * Integrates Sidebar, Header, air-gap banner, mock data notice, and content stage.
 */
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { IconAlertTriangle } from '../common/Icons';

export function AppLayout({
  currentTab,
  onSelectTab,
  currentTitle,
  globalDisposition,
  isMock = true,
  backendHealth = null,
  isBackendConnected = false,
  children
}) {
  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

      <div className="app-main-wrapper">
        <Header
          currentTitle={currentTitle}
          globalDisposition={globalDisposition}
          backendHealth={backendHealth}
          isBackendConnected={isBackendConnected}
        />

        <main className="app-content">
          {/* Explicit Mock Data / Demo Banner */}
          {isMock && (
            <div className="mock-notice-banner" role="status">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="mock-notice-badge">OFFLINE STANDBY DATA</span>
                <span>
                  Currently displaying offline assurance baseline data in standby mode.
                  Live cryptographic evaluation is engaged when the backend assurance service is reachable.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <IconAlertTriangle size={14} color="#f59e0b" />
                <span>Standby Mode</span>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
