import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  subtextLeft?: string;
  subtextRight?: string;
  progressPercent?: number;
  progressBarColor?: 'indigo' | 'emerald' | 'amber' | 'rose';
  cardColor?: 'blue' | 'purple' | 'amber' | 'rose';
  icon: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtextLeft,
  subtextRight,
  progressPercent = 0,
  progressBarColor = 'indigo',
  cardColor = 'blue',
  icon,
}) => {
  return (
    <div className={`kpi-card card-${cardColor}`}>
      <div className="kpi-head">
        <span className="kpi-title">{title}</span>
        <div className={`kpi-icon icon-${cardColor}`}>{icon}</div>
      </div>

      <div className="kpi-value">{value}</div>

      {(subtextLeft || subtextRight) && (
        <div className="kpi-subtext">
          <span>{subtextLeft}</span>
          <span>{subtextRight}</span>
        </div>
      )}

      {progressPercent !== undefined && (
        <div className="kpi-progress">
          <div
            className={`kpi-progress-bar bg-${progressBarColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
};
