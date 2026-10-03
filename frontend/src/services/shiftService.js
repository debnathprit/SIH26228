/**
 * DISTRIBUTION SHIFT SERVICE
 * PS ID 26228 | MoD / Indian Army DGIS
 */
import { request } from './api';
import { mockDistributionShift } from '../mock/mockData';

export const shiftService = {
  async evaluateDistributionShift(file, referenceDataset = null) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (referenceDataset && typeof referenceDataset === 'string' && referenceDataset.trim() !== '') {
      formData.append('reference_dataset', referenceDataset.trim());
    }

    return request(
      '/assurance/distribution-shift/evaluate',
      {
        method: 'POST',
        body: formData
      },
      mockDistributionShift
    );
  },

  async evaluateShift(shiftConfig) {
    return request('/shift/evaluate', {
      method: 'POST',
      body: JSON.stringify(shiftConfig)
    }, mockDistributionShift);
  },

  async getLatestShift() {
    return request('/shift/latest', { method: 'GET' }, mockDistributionShift);
  }
};
