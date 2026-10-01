/**
 * DISTRIBUTION SHIFT SERVICE
 * PS ID 26228 | MoD / Indian Army DGIS
 */
import { request } from './api';
import { mockDistributionShift } from '../mock/mockData';

export const shiftService = {
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
