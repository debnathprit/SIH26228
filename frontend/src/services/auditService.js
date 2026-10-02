/**
 * AUDIT TRAIL SERVICE
 * PS ID 26228 | MoD / Indian Army DGIS
 */
import { request } from './api';
import { mockAuditTrail } from '../mock/mockData';

export const auditService = {
  async getAuditTrail() {
    return request('/audit/trail', { method: 'GET' }, mockAuditTrail);
  },

  async verifyChainIntegrity() {
    return request('/audit/verify', { method: 'POST' }, {
      isMock: true,
      verified: true,
      chainLength: mockAuditTrail.length,
      brokenLinks: 0,
      timestamp: new Date().toISOString()
    });
  }
};
