/**
 * CV INTEGRITY ASSURANCE — FORMATTERS
 * PS ID 26228 | MoD / Indian Army DGIS
 */

/**
 * Truncate SHA-256 hash or digest for display
 * e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 -> e3b0c442...7852b855
 */
export function truncateHash(hash, lead = 8, trail = 8) {
  if (!hash || typeof hash !== 'string') return 'N/A';
  if (hash.length <= lead + trail) return hash;
  return `${hash.slice(0, lead)}...${hash.slice(-trail)}`;
}

/**
 * Format decimal confidence to percentage string
 * e.g. 0.8942 -> "89.4%"
 */
export function formatConfidence(conf) {
  if (conf === null || conf === undefined || isNaN(conf)) return 'N/A';
  return `${(conf * 100).toFixed(1)}%`;
}

/**
 * Format ISO timestamp to readable UTC date time
 */
export function formatTimestamp(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return isoString;
  }
}

/**
 * Convert status string to CSS class identifier
 */
export function getStatusClass(status) {
  if (!status) return 'status-not-assessed';
  const norm = status.toLowerCase().replace(/[\s_]+/g, '-');
  if (norm.includes('verif') || norm.includes('accept')) return 'status-verified';
  if (norm.includes('review') || norm.includes('warn')) return 'status-review';
  if (norm.includes('quarantine') || norm.includes('fail') || norm.includes('tamper')) return 'status-quarantine';
  return 'status-not-assessed';
}

/**
 * Convert severity string to CSS class identifier
 */
export function getSeverityClass(severity) {
  if (!severity) return 'sev-low';
  const norm = severity.toLowerCase();
  if (norm === 'critical') return 'sev-critical';
  if (norm === 'high') return 'sev-high';
  if (norm === 'medium') return 'sev-medium';
  return 'sev-low';
}
