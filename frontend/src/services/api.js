/**
 * CV INTEGRITY ASSURANCE — BASE API CLIENT
 * PS ID 26228 | MoD / Indian Army DGIS
 * 
 * Offline-first API client.
 * Tries local backend endpoint; if offline or unreachable,
 * transparently falls back to local mock data without breaking the UI.
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

let isBackendReachable = true;
let lastCheckTime = 0;
const RETRY_INTERVAL_MS = 15000;

export async function request(endpoint, options = {}, mockFallback = null) {
  const now = Date.now();
  if (!isBackendReachable && now - lastCheckTime < RETRY_INTERVAL_MS) {
    return { data: mockFallback, isMock: true, error: null };
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    isBackendReachable = true;
    return { data: json, isMock: false, error: null };
  } catch (err) {
    isBackendReachable = false;
    lastCheckTime = Date.now();
    // Graceful offline fallback
    if (mockFallback !== null) {
      return {
        data: mockFallback,
        isMock: true,
        error: `Local backend unreachable (${err.message}). Using local mock data.`
      };
    }
    return { data: null, isMock: false, error: err.message };
  }
}
