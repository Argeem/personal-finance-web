import React, { useMemo } from 'react';
import { LandInstallment } from '../../../core/domain/LandInstallment';
import { formatCurrency } from '../../utils/formatters';

interface InstallmentGridProps {
  installments: LandInstallment[];
  allInstallments: LandInstallment[];
  nextDuePeriod: number | undefined;
  activeYear: string;
  onYearChange: (year: string) => void;
  onSelectPeriod: (period: number) => void;
}

export const InstallmentGrid: React.FC<InstallmentGridProps> = ({
  installments,
  allInstallments,
  nextDuePeriod,
  activeYear,
  onYearChange,
  onSelectPeriod,
}) => {
  const years = ['all', '2569', '2570', '2571', '2572', '2573', '2574', '2575'];

  // Calculate cumulative previous months total for every period (1 to 72)
  const prevCumulativeMap = useMemo(() => {
    const map: Record<number, number> = {};
    let runningTotal = 0;

    // Sort by period
    const sorted = [...allInstallments].sort((a, b) => a.period - b.period);
    for (const inst of sorted) {
      // The cumulative total before this installment
      map[inst.period] = runningTotal;
      // Add this installment's amount (actual paid if paid, else planned amount)
      const thisAmount = inst.paid ? inst.amount : (inst.plannedAmount || 10000);
      runningTotal += thisAmount;
    }

    return map;
  }, [allInstallments]);

  return (
    <div>
      {/* Year Filter Tabs */}
      <div className="year-tabs-container">
        {years.map(y => (
          <button
            key={y}
            type="button"
            className={`year-tab-btn ${activeYear === y ? 'active' : ''}`}
            onClick={() => onYearChange(y)}
          >
            {y === 'all' ? 'ดูทุกปี (72 งวด)' : `ปี ${y}`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="installments-grid">
        {installments.map(inst => {
          const isPaid = inst.paid;
          const isCurrent = nextDuePeriod === inst.period;
          const prevTotal = prevCumulativeMap[inst.period] ?? 0;
          const thisAmount = isPaid ? inst.amount : (inst.plannedAmount || 10000);
          const totalAfterThis = prevTotal + thisAmount;

          return (
            <div
              key={inst.period}
              className={`installment-card ${isPaid ? 'is-paid' : ''} ${isCurrent ? 'is-current' : ''}`}
            >
              <div className="inst-head">
                <span className="inst-number">งวดที่ {inst.period} / 72</span>
                <span className={`badge ${isPaid ? 'badge-paid' : isCurrent ? 'badge-debt' : 'badge-pending'}`}>
                  {isPaid ? '✅ จ่ายแล้ว' : isCurrent ? '⏳ งวดถัดไป' : 'รอชำระ'}
                </span>
              </div>

              <div>
                <div className="inst-month-year">
                  {inst.month} {inst.year}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                  <div
                    className="inst-amount"
                    style={{
                      color: isPaid
                        ? 'var(--emerald-400)'
                        : isCurrent
                        ? 'var(--amber-400)'
                        : 'var(--text-main)',
                    }}
                  >
                    {formatCurrency(thisAmount)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {isPaid ? '(ยอดจ่ายจริง)' : '(ค่างวด)'}
                  </span>
                </div>

                {/* Previous Month Total Box */}
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    margin: '10px 0',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ยอดรวมเดือนก่อนหน้า:</span>
                    <strong style={{ color: 'var(--indigo-400)', fontWeight: 700 }}>
                      {formatCurrency(prevTotal)}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                      paddingTop: '4px',
                      borderTop: '1px dashed var(--border-subtle)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>รวมสะสมถึงงวดนี้:</span>
                    <strong style={{ color: isPaid ? 'var(--emerald-400)' : 'var(--text-secondary)', fontWeight: 600 }}>
                      {formatCurrency(totalAfterThis)}
                    </strong>
                  </div>
                </div>

                {inst.note && (
                  <div style={{ fontSize: '11px', color: 'var(--amber-400)', marginTop: '2px' }}>
                    {inst.note}
                  </div>
                )}
              </div>

              <div className="inst-footer">
                <span>{isPaid ? 'ชำระเสร็จสิ้น' : `ปกติ ${formatCurrency(inst.plannedAmount || 10000)}`}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSelectPeriod(inst.period)}
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  {isPaid ? 'แก้ไขยอด' : 'ชำระ / แก้ยอด'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
