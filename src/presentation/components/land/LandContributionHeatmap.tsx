import React from 'react';
import { LandInstallment, LandSummaryMetrics } from '../../../core/domain/LandInstallment';
import { formatCurrency } from '../../utils/formatters';

interface LandContributionHeatmapProps {
  allInstallments: LandInstallment[];
  metrics?: LandSummaryMetrics;
  onSelectPeriod?: (period: number) => void;
}

export function getLandCellColor(item: LandInstallment): { bg: string; border: string } {
  if (!item.paid || item.amount <= 0) {
    return {
      bg: 'rgba(255, 255, 255, 0.07)',
      border: 'rgba(255, 255, 255, 0.12)',
    };
  }

  const amt = item.amount;
  if (amt <= 5000) {
    // จ่ายน้อยกว่าเท่ากับ 5000 ที่แดง
    return {
      bg: '#ef4444',
      border: '#dc2626',
    };
  } else if (amt < 10000) {
    // จ่ายน้อยกว่า 10000 เป็นสีเหลือง
    return {
      bg: '#eab308',
      border: '#ca8a04',
    };
  } else if (amt === 10000) {
    // 10000 พอดีเป็นเขียว
    return {
      bg: '#22c55e',
      border: '#16a34a',
    };
  } else if (amt < 15000) {
    // มากกว่า 10000 เป็นสีเขียวเข้ม
    return {
      bg: '#15803d',
      border: '#166534',
    };
  } else {
    // มากกว่าเท่ากับ 15000 เข้มมากๆ
    return {
      bg: '#064e3b',
      border: '#022c22',
    };
  }
}

export const LandContributionHeatmap: React.FC<LandContributionHeatmapProps> = ({
  allInstallments,
  onSelectPeriod,
}) => {
  return (
    <div className="land-progress-map-wrapper">
      <div className="land-progress-map-grid">
        {allInstallments.map((item) => {
          const color = getLandCellColor(item);
          return (
            <button
              key={item.period}
              type="button"
              className="land-progress-cell"
              onClick={() => onSelectPeriod?.(item.period)}
              title={`งวดที่ ${item.period}: ${item.month} ${item.year} - ${item.paid ? `ชำระแล้ว ${formatCurrency(item.amount)}` : 'ยังไม่ชำระ'}`}
              style={{
                backgroundColor: color.bg,
                borderColor: color.border,
              }}
              aria-label={`งวดที่ ${item.period}`}
            />
          );
        })}
      </div>

      {/* GitHub-style Footer: Less ... More */}
      <div className="land-progress-footer">
        <div className="land-progress-legend">
          <span className="legend-label">Less</span>
          <span
            className="legend-cell"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
            title="ยังไม่ถึงงวด / รอชำระ"
          />
          <span
            className="legend-cell"
            style={{ backgroundColor: '#ef4444', borderColor: '#dc2626' }}
            title="จ่ายน้อยกว่าเกณฑ์ (≤ ฿5,000)"
          />
          <span
            className="legend-cell"
            style={{ backgroundColor: '#eab308', borderColor: '#ca8a04' }}
            title="จ่ายต่ำกว่าปกติ (< ฿10,000)"
          />
          <span
            className="legend-cell"
            style={{ backgroundColor: '#22c55e', borderColor: '#16a34a' }}
            title="จ่ายตรงตามเกณฑ์ (฿10,000 พอดี)"
          />
          <span
            className="legend-cell"
            style={{ backgroundColor: '#15803d', borderColor: '#166534' }}
            title="จ่ายเกินเกณฑ์ (> ฿10,000)"
          />
          <span
            className="legend-cell"
            style={{ backgroundColor: '#064e3b', borderColor: '#022c22' }}
            title="จ่ายโปะพิเศษ (≥ ฿15,000)"
          />
          <span className="legend-label">More</span>
        </div>
      </div>
    </div>
  );
};
