/**
 * INFERENCE VERIFICATION SERVICE
 * PS ID 26228 | MoD / Indian Army DGIS
 */
import { request } from './api';
import { mockInferenceVerification } from '../mock/mockData';

export const inferenceService = {
  async verifyInference(record) {
    return request('/inference/verify', {
      method: 'POST',
      body: JSON.stringify(record)
    }, mockInferenceVerification);
  },

  async getLatestVerification() {
    return request('/inference/latest', { method: 'GET' }, mockInferenceVerification);
  }
};
