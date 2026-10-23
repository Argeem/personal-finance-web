import React from 'react';
import { Check, Edit2 } from 'lucide-react';
import { LandInstallment, LandSummaryMetrics } from '../../../core/domain/LandInstallment';
import { formatCurrency } from '../../utils/formatters';
import { LandContributionHeatmap } from './LandContributionHeatmap';

interface LandHeroCardProps {
  metrics: LandSummaryMetrics;
  allInstallments?: LandInstallment[];
  onSelectPeriod?: (period: number) => void;
  onPayNext: () => void;
  onEditNextAmount?: () => void;
}

export const LandHeroCard: React.FC<LandHeroCardProps> = ({
  metrics,
  allInstallments = [],
  onSelectPeriod,
  onPayNext,
  onEditNextAmount,
}) => {
  const next = metrics.nextDueInstallment;
  const nextAmount = next ? (next.amount > 0 ? next.amount : (next.plannedAmount || 10000)) : 0;
  const handleEditAmount = onEditNextAmount || onPayNext;

  return (
    <div className="land-hero-card">
      <div className="land-hero-grid">
        <div className="land-hero-left">
          <h3>
            <span>🏞️ บัญชีติดตามการผ่อนชำระที่ดิน</span>
            <span className="badge badge-paid">72 งวด (6 ปี)</span>
          </h3>

          <span className="land-hero-note">
            📅 หมายเหตุรอบบิล: ตัดรอบทุกวันที่ 21 ถึง 20 ของเดือน (เช่น มิ.ย. คือ 21 พ.ค. - 20 มิ.ย.)
          </span>

          {/* Top Dashboard Metrics Grid */}
          <div className="land-stats-row">
            <div className="land-stat-card" style={{ borderLeft: '3.5px solid var(--emerald-500)' }}>
              <span className="title" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                💰 จำนวนเงินที่ผ่อนไปแล้ว
              </span>
              <div className="val" style={{ color: 'var(--emerald-400)', fontSize: '20px', fontWeight: 800 }}>
                {formatCurrency(metrics.totalPaidAmount)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                ชำระแล้ว <strong>{metrics.paidPeriodsCount}</strong> จาก {metrics.totalPeriods} งวด ({metrics.progressPercent}%)
              </div>
            </div>

            <div className="land-stat-card" style={{ borderLeft: '3.5px solid var(--amber-500)' }}>
              <span className="title" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                📉 ยอดคงเหลือที่ต้องผ่อนต่อ
              </span>
              <div className="val" style={{ color: 'var(--amber-400)', fontSize: '20px', fontWeight: 800 }}>
                {formatCurrency(metrics.remainingDebt)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                เหลืออีก <strong>{metrics.remainingPeriodsCount}</strong> งวด (จาก 72 งวด)
              </div>
            </div>

            <div className="land-stat-card" style={{ borderLeft: '3.5px solid var(--indigo-500)' }}>
              <span className="title" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                🏛️ ยอดรวมตามสัญญาประเมิน
              </span>
              <div className="val" style={{ color: 'var(--text-main)', fontSize: '20px', fontWeight: 800 }}>
                {formatCurrency(metrics.contractEstimatedTotal)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                72 งวด (งวดปกติ ฿10,000/เดือน)
              </div>
            </div>

            <div className="land-stat-card" style={{ borderLeft: '3.5px solid var(--emerald-400)' }}>
              <span className="title" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                📊 ความคืบหน้าการผ่อน
              </span>
              <div className="val" style={{ color: 'var(--emerald-400)', fontSize: '20px', fontWeight: 800 }}>
                {metrics.progressPercent}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                เป้าหมายสิ้นสุด พ.ค. 2575 (6 ปี)
              </div>
            </div>
          </div>

          {/* Compact 72-Month Progress Map (under the 4 stat cards) */}
          {allInstallments && allInstallments.length > 0 && (
            <LandContributionHeatmap
              allInstallments={allInstallments}
              onSelectPeriod={onSelectPeriod}
            />
          )}
        </div>

        {/* Next Due Action Card (งวดที่ต้องชำระถัดไป) */}
        <div className="next-pay-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="next-badge">งวดที่ต้องชำระถัดไป</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {next ? `งวดที่ ${next.period} / 72` : 'เสร็จสิ้น'}
            </span>
          </div>

          <div>
            <h4 style={{ fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>
              {next ? `${next.month} ${next.year}` : 'ผ่อนชำระครบถ้วนแล้ว 🎉'}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              รอบการชำระ: ทุกวันที่ 21 ถึง 20 ของเดือน
            </p>

            {/* Next Amount Display with Quick Edit Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '8px 0',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div className="next-amount-display" style={{ margin: 0 }}>
                {next ? formatCurrency(nextAmount) : '฿0'}
              </div>

              {next && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleEditAmount}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-md)',
                  }}
                  title="แก้ไขยอดเงินที่จะจ่ายในเดือนนี้"
                >
                  <Edit2 size={13} />
                  แก้ไขยอดเงินเดือนนี้
                </button>
              )}
            </div>

            {/* Quick breakdown of previous and next cumulative total */}
            {next && (
              <div
                style={{
                  fontSize: '12px',
                  background: 'var(--bg-surface)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '14px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ยอดผ่อนสะสมก่อนหน้านี้:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(metrics.totalPaidAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>เมื่อชำระงวดนี้ ยอดสะสมจะเป็น:</span>
                  <strong style={{ color: 'var(--emerald-400)' }}>{formatCurrency(metrics.totalPaidAmount + nextAmount)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons row */}
          {next && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleEditAmount}
                style={{
                  flex: '1',
                  minWidth: '110px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                }}
                title="แก้ไขยอดเงินที่จะจ่ายในเดือนนี้"
              >
                <Edit2 size={14} />
                แก้ยอดเงิน
              </button>

              <button
                type="button"
                className="btn btn-emerald"
                onClick={onPayNext}
                style={{
                  flex: '2',
                  minWidth: '170px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Check size={16} strokeWidth={2.5} />
                บันทึกชำระงวดที่ {next.period} ({formatCurrency(nextAmount)})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
