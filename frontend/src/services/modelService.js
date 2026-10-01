/**
 * MODEL ASSURANCE SERVICE
 * PS ID 26228 | MoD / Indian Army DGIS
 */
import { request } from './api';
import { mockModelAssurance } from '../mock/mockData';

export const modelService = {
  async evaluateModel(modelConfig) {
    return request('/model/evaluate', {
      method: 'POST',
      body: JSON.stringify(modelConfig)
    }, mockModelAssurance);
  },

  async getLatestAssurance() {
    return request('/model/latest', { method: 'GET' }, mockModelAssurance);
  }
};
