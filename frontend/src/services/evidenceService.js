/**
 * EVIDENCE SERVICE
 * PS ID 26228 | MoD / Indian Army DGIS
 */
import { request } from './api';
import { mockEvidenceList } from '../mock/mockData';

export const evidenceService = {
  async getEvidenceList() {
    return request('/evidence', { method: 'GET' }, mockEvidenceList);
  },

  async getEvidenceById(id) {
    const found = mockEvidenceList.find(e => e.id === id);
    return request(`/evidence/${id}`, { method: 'GET' }, found || null);
  }
};
