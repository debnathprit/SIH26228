/**
 * DATASET ASSURANCE SERVICE
 * PS ID 26228 | MoD / Indian Army DGIS
 */
import { request } from './api';
import { mockDatasetAssurance, mockSystemOverview } from '../mock/mockData';

export const datasetService = {
  async getOverview() {
    return request('/system/overview', { method: 'GET' }, mockSystemOverview);
  },

  async evaluateDataset(datasetConfig) {
    return request('/dataset/evaluate', {
      method: 'POST',
      body: JSON.stringify(datasetConfig)
    }, mockDatasetAssurance);
  },

  async getLatestAssurance() {
    return request('/dataset/latest', { method: 'GET' }, mockDatasetAssurance);
  }
};
