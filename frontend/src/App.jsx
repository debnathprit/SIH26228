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
import { datasetService } from './services/datasetService';
import { modelService } from './services/modelService';
import { inferenceService } from './services/inferenceService';
import { shiftService } from './services/shiftService';
import { evidenceService } from './services/evidenceService';
import { auditService } from './services/auditService';
import { reportService } from './services/reportService';

import { mockSystemOverview, mockDatasetAssurance, mockModelAssurance, mockInferenceVerification, mockDistributionShift, mockEvidenceList, mockAuditTrail } from './mock/mockData';
import { mockAssuranceReport } from './mock/mockReport';

export function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [highlightedEvidenceId, setHighlightedEvidenceId] = useState(null);

  // Live Backend System States (Phase 3B Step 1)
  const [backendHealth, setBackendHealth] = useState(null);
  const [systemOverview, setSystemOverview] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Pillar Data States
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
    // Attempt to load from service layer (gracefully uses mock data if backend offline)
    async function loadData() {
      // Step 1: Health & System Overview live integration
      try {
        const [healthRes, sysRes] = await Promise.all([
          systemService.getHealth(),
          systemService.getOverview()
        ]);

        if (healthRes.data && healthRes.data.status === 'ok') {
          setBackendHealth(healthRes.data);
          setIsBackendConnected(true);
        } else {
          setIsBackendConnected(false);
        }

        if (sysRes.data && sysRes.data.components) {
          setSystemOverview(sysRes.data);
        }
      } catch (err) {
        console.warn('Backend system endpoints check failed:', err);
        setIsBackendConnected(false);
      }

      // Load pillar datasets (falling back to mock data if backend endpoints are not yet implemented)
      try {
        const [dsRes, mdRes, infRes, shRes, evRes, audRes, repRes] = await Promise.all([
          datasetService.getLatestAssurance(),
          modelService.getLatestAssurance(),
          inferenceService.getLatestVerification(),
          shiftService.getLatestShift(),
          evidenceService.getEvidenceList(),
          auditService.getAuditTrail(),
          reportService.getLatestReport()
        ]);

        if (dsRes.data) setDatasetData(dsRes.data);
        if (mdRes.data) setModelData(mdRes.data);
        if (infRes.data) setInferenceData(infRes.data);
        if (shRes.data) setShiftData(shRes.data);
        if (evRes.data) setEvidenceList(evRes.data);
        if (audRes.data) setAuditList(audRes.data);
        if (repRes.data) setReportData(repRes.data);

        // Keep mock banner active for pipeline pillars until Person A implements evaluation endpoints
        setIsMockActive(true);
      } catch (err) {
        console.warn('Backend unavailable, running in local air-gapped demo mode:', err);
        setIsMockActive(true);
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
