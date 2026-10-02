/**
 * HASH DISPLAY COMPONENT
 * Truncates SHA-256 digests while providing copy-to-clipboard functionality
 * and expandable full view on hover or click.
 */
import React, { useState } from 'react';
import { truncateHash } from '../../utils/formatters';
import { IconCopy, IconCheckCircle } from './Icons';

export function HashDisplay({ hash, lead = 8, trail = 8, copyable = true }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!hash) return <span className="hash-container text-muted">NONE</span>;

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div 
      className="hash-container" 
      title={hash}
      onClick={() => setExpanded(!expanded)}
      style={{ cursor: 'pointer' }}
    >
      <span>{expanded ? hash : truncateHash(hash, lead, trail)}</span>
      {copyable && (
        <button
          className="hash-copy-btn"
          onClick={handleCopy}
          title="Copy full cryptographic hash"
          aria-label="Copy hash"
        >
          {copied ? <IconCheckCircle size={13} color="var(--status-verified-text)" /> : <IconCopy size={13} />}
        </button>
      )}
    </div>
  );
}
