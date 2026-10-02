/**
 * APP ROOT COMPONENT
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Manages top-level state, active navigation tab, global disposition,
 * and service data loading with offline mock fallback.
 */
import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/Overview/OverviewPage';
import { DatasetAssurancePage } from './pages/DatasetAssurance/DatasetAssurancePage';
import { ModelAssurancePage } from './pages/ModelAssurance/ModelAssurancePage';
import { InferenceVerificationPage } from './pages/InferenceVerification/InferenceVerificationPage';
import { DistributionShiftPage } from './pages/DistributionShift/DistributionShiftPage';
import { EvidenceViewerPage } from './pages/EvidenceViewer/EvidenceViewerPage';
import { AuditTrailPage } from './pages/AuditTrail/AuditTrailPage';
import { AssuranceReportPage } from './pages/AssuranceReport/AssuranceReportPage';

import { systemService } from './services/systemService';
import { assuranceService } from './services/assuranceService';

import { mockSystemOverview, mockDatasetAssurance, mockModelAssurance, mockInferenceVerification, mockDistributionShift, mockEvidenceList, mockAuditTrail } from './mock/mockData';
import { mockAssuranceReport } from './mock/mockReport';

export function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [highlightedEvidenceId, setHighlightedEvidenceId] = useState(null);

  // Live Backend System States (Phase 3B Step 1)
  const [backendHealth, setBackendHealth] = useState(null);
  const [systemOverview, setSystemOverview] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const [assuranceLoading, setAssuranceLoading] = useState(true);
  const [assuranceError, setAssuranceError] = useState(null);

  // Pillar Data States (initialized to mock data for demo/fallback mode)
  const [overviewData, setOverviewData] = useState(mockSystemOverview);
  const [datasetData, setDatasetData] = useState(mockDatasetAssurance);
  const [modelData, setModelData] = useState(mockModelAssurance);
  const [inferenceData, setInferenceData] = useState(mockInferenceVerification);
  const [shiftData, setShiftData] = useState(mockDistributionShift);
  const [evidenceList, setEvidenceList] = useState(mockEvidenceList);
  const [auditList, setAuditList] = useState(mockAuditTrail);
  const [reportData, setReportData] = useState(mockAssuranceReport);

  const [isMockActive, setIsMockActive] = useState(true);

  useEffect(() => {
    // Attempt to load authoritative live backend data
    async function loadData() {
      // Intended sequential startup request flow:
      // 1. health -> 2. system/overview -> 3. assurance/summary
      setAssuranceLoading(true);
      try {
        // Step 1: Health check
        const healthRes = await systemService.getHealth();
        if (healthRes.data && healthRes.data.status === 'ok') {
          setBackendHealth(healthRes.data);
          setIsBackendConnected(true);

          // Step 2: System Overview
          try {
            const sysRes = await systemService.getOverview();
            if (sysRes.data && sysRes.data.components) {
              setSystemOverview(sysRes.data);
            }
          } catch (sysErr) {
            console.warn('System overview check failed:', sysErr);
          }

          // Step 3: Assurance Summary
          const sumRes = await assuranceService.getAssuranceSummary();
          if (sumRes.data) {
            setOverviewData(sumRes.data);
            setIsMockActive(Boolean(sumRes.isMock));
            setAssuranceError(null);
          } else {
            setIsMockActive(true);
          }
        } else {
          setIsBackendConnected(false);
          setIsMockActive(true);
        }
      } catch (err) {
        console.warn('Backend system endpoints check failed:', err);
        setIsBackendConnected(false);
        setIsMockActive(true);
        setAssuranceError(err.message || 'Failed to load assurance summary');
      } finally {
        setAssuranceLoading(false);
      }
    }

    loadData();
  }, []);

  const handleNavigateToEvidence = (evidenceId) => {
    setHighlightedEvidenceId(evidenceId);
    setCurrentTab('evidence');
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'overview': return 'Executive Assurance Overview';
      case 'dataset': return 'Training-Data Integrity Assurance';
      case 'model': return 'Model Integrity & Behavioral Assessment';
      case 'inference': return 'Inference Provenance & Cryptographic Binding';
      case 'shift': return 'Distribution Shift & Anomaly Analysis';
      case 'evidence': return 'Evidence Ledger & Proof Records';
      case 'audit': return 'Tamper-Evident Chronological Audit Ledger';
      case 'report': return 'Official Assurance Evaluation Report';
      default: return 'Computer Vision Assurance System';
    }
  };

  const renderActivePage = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <OverviewPage
            data={overviewData}
            onNavigate={setCurrentTab}
            backendHealth={backendHealth}
            systemOverview={systemOverview}
            isBackendConnected={isBackendConnected}
            assuranceLoading={assuranceLoading}
            assuranceError={assuranceError}
          />
        );
      case 'dataset':
        return <DatasetAssurancePage data={datasetData} onNavigateToEvidence={handleNavigateToEvidence} />;
      case 'model':
        return <ModelAssurancePage data={modelData} onNavigateToEvidence={handleNavigateToEvidence} />;
      case 'inference':
        return <InferenceVerificationPage data={inferenceData} />;
      case 'shift':
        return <DistributionShiftPage data={shiftData} />;
      case 'evidence':
        return <EvidenceViewerPage evidenceList={evidenceList} highlightedId={highlightedEvidenceId} />;
      case 'audit':
        return <AuditTrailPage auditEvents={auditList} />;
      case 'report':
        return <AssuranceReportPage report={reportData} />;
      default:
        return (
          <OverviewPage
            data={overviewData}
            onNavigate={setCurrentTab}
            backendHealth={backendHealth}
            systemOverview={systemOverview}
            isBackendConnected={isBackendConnected}
            assuranceLoading={assuranceLoading}
            assuranceError={assuranceError}
          />
        );
    }
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setHighlightedEvidenceId(null);
        setCurrentTab(tab);
      }}
      currentTitle={getPageTitle()}
      globalDisposition={overviewData.globalDisposition}
      isMock={isMockActive}
      backendHealth={backendHealth}
      isBackendConnected={isBackendConnected}
    >
      {renderActivePage()}
    </AppLayout>
  );
}

export default App;
