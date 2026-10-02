/**
 * ASSURANCE SERVICE
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Interacts with live lifecycle assurance summary:
 * - GET /api/v1/assurance/summary
 */
import { request } from './api.js';
import { mockSystemOverview } from '../mock/mockData.js';

export const assuranceService = {
  async getAssuranceSummary() {
    return request('/assurance/summary', { method: 'GET' }, mockSystemOverview);
  }
};
