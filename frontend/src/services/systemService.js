/**
 * SYSTEM SERVICE (STEP 1 INTEGRATION)
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Interacts with system-level backend endpoints:
 * - GET /api/v1/health
 * - GET /api/v1/system/overview
 */
import { checkHealth, getSystemOverview } from './api.js';

export const systemService = {
  async getHealth() {
    return checkHealth();
  },

  async getOverview() {
    return getSystemOverview();
  }
};
