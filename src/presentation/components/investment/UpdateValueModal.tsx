import React, { useState, useEffect } from 'react';
import { X, TrendingUp, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { InvestmentItem } from '../../../core/domain/Investment';

interface UpdateValueModalProps {
  isOpen: boolean;
  item: InvestmentItem | null;
  onClose: () => void;
  onSubmit: (id: string, newValue: number) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export const UpdateValueModal: React.FC<UpdateValueModalProps> = ({
  isOpen,
  item,
  onClose,
  onSubmit,
  onNotify,
}) => {
  const [valueStr, setValueStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setValueStr(item.currentValue.toString());
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const cost = item.costBasis;
  const newValue = parseFloat(valueStr) || 0;
  const pnlAmount = newValue - cost;
  const pnlPercent = cost > 0 ? (pnlAmount / cost) * 100 : 0;
  const isProfit = pnlAmount > 0;
  const isLoss = pnlAmount < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(newValue) || newValue < 0) {
      onNotify('กรุณาระบุมูลค่าที่ถูกต้อง (ต้องไม่ติดลบ)', 'info');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(item.id, newValue);
      onNotify(`อัปเดตมูลค่าปัจจุบันของ ${item.name} เรียบร้อยแล้ว`, 'success');
      onClose();
    } catch (err: any) {
      onNotify(`เกิดข้อผิดพลาด: ${err.message}`, 'info');
    } finally {
      setSubmitting(false);
    }
  };

  const adjustPercent = (pct: number) => {
    const calculated = cost * (1 + pct / 100);
    setValueStr(Math.round(calculated).toString());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--sky-400)',
              }}
            >
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                อัปเดตมูลค่าปัจจุบัน ({item.name})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                ใส่ตัวเลขล่าสุดเพื่อคำนวณกำไร/ขาดทุนทันที
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} style={{ width: 30, height: 30 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Cost Basis Reference */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  ต้นทุนสะสม (Cost Basis)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {cost.toLocaleString()} ฿
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  มูลค่าก่อนหน้า
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {item.currentValue.toLocaleString()} ฿
                </div>
              </div>
            </div>

            {/* Input field */}
            <div className="form-group">
              <label>มูลค่าตลาดปัจจุบัน (Market Value ล่าสุด):</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  required
                  className="form-control"
                  style={{ fontSize: '20px', fontWeight: 700, paddingRight: '45px' }}
                  placeholder="0.00"
                  value={valueStr}
                  onChange={e => setValueStr(e.target.value)}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  ฿
                </span>
              </div>
            </div>

            {/* Quick adjust percentage buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
                ปรับเทียบ:
              </span>
              {[-10, -5, 0, 5, 10, 20].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => adjustPercent(pct)}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: pct > 0 ? 'var(--emerald-400)' : pct < 0 ? 'var(--rose-400)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>

            {/* Real-time P&L Preview Card */}
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: isProfit
                  ? 'rgba(16, 185, 129, 0.08)'
                  : isLoss
                  ? 'rgba(239, 68, 68, 0.08)'
                  : 'var(--bg-surface-elevated)',
                border: `1px solid ${
                  isProfit
                    ? 'rgba(16, 185, 129, 0.25)'
                    : isLoss
                    ? 'rgba(239, 68, 68, 0.25)'
                    : 'var(--border-subtle)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Percent size={13} /> กำไร / ขาดทุน (P&L):
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: isProfit
                      ? 'rgba(16, 185, 129, 0.2)'
                      : isLoss
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'var(--bg-surface)',
                    color: isProfit
                      ? 'var(--emerald-400)'
                      : isLoss
                      ? 'var(--rose-400)'
                      : 'var(--text-muted)',
                  }}
                >
                  {isProfit ? 'กำไร (Profit)' : isLoss ? 'ขาดทุน (Loss)' : 'เท่าทุน (Even)'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: isProfit
                      ? 'var(--emerald-400)'
                      : isLoss
                      ? 'var(--rose-400)'
                      : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isProfit ? <ArrowUpRight size={22} /> : isLoss ? <ArrowDownRight size={22} /> : null}
                  {pnlAmount > 0 ? `+${pnlAmount.toLocaleString()}` : pnlAmount.toLocaleString()} ฿
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: isProfit
                      ? 'var(--emerald-400)'
                      : isLoss
                      ? 'var(--rose-400)'
                      : 'var(--text-muted)',
                  }}
                >
                  ({pnlPercent > 0 ? `+${pnlPercent.toFixed(2)}%` : `${pnlPercent.toFixed(2)}%`})
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'กำลังบันทึก...' : 'บันทึกมูลค่าปัจจุบัน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
