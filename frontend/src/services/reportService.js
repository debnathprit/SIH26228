/**
 * ASSURANCE REPORT SERVICE
 * PS ID 26228 | MoD / Indian Army DGIS
 */
import { request } from './api';
import { mockAssuranceReport } from '../mock/mockReport';

export const reportService = {
  async getLatestReport() {
    return request('/report/assurance', { method: 'GET' }, mockAssuranceReport);
  },

  async generateReport(options) {
    return request('/report/generate', {
      method: 'POST',
      body: JSON.stringify(options)
    }, mockAssuranceReport);
  }
};
