/**
 * SECTION CARD COMPONENT
 * Standard card container with title, subtitle, right-side action or badge slot.
 */
import React from 'react';

export function SectionCard({ title, subtitle, icon, badge, actions, children, className = '' }) {
  return (
    <section className={`section-card ${className}`}>
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">
            {icon && <span>{icon}</span>}
            <span>{title}</span>
          </h2>
          {subtitle && <p className="section-card-subtitle">{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {badge && <div>{badge}</div>}
          {actions && <div>{actions}</div>}
        </div>
      </div>
      <div className="section-card-body">
        {children}
      </div>
    </section>
  );
}
