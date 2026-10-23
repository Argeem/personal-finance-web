import React, { useState } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { InvestmentItem } from '../../../core/domain/Investment';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  item: InvestmentItem | null;
  mode: 'deposit' | 'withdraw';
  onClose: () => void;
  onSubmit: (id: string, amount: number, note?: string) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export const DepositWithdrawModal: React.FC<DepositWithdrawModalProps> = ({
  isOpen,
  item,
  mode,
  onClose,
  onSubmit,
  onNotify,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const isDeposit = mode === 'deposit';
  const title = isDeposit
    ? `ฝากเงิน / เพิ่มทุน: ${item.name}`
    : `ถอนเงิน / ลดทุน: ${item.name}`;

  const presets = isDeposit
    ? [500, 1000, 2000, 5000, 10000]
    : [500, 1000, 2000, 5000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      onNotify('กรุณาระบุจำนวนเงินที่ถูกต้อง', 'info');
      return;
    }

    if (!isDeposit && amount > item.currentValue) {
      onNotify(`ยอดถอนเกินมูลค่าปัจจุบัน (${item.currentValue.toLocaleString()} ฿)`, 'info');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(item.id, amount, note);
      onNotify(
        `${isDeposit ? 'ฝากเงิน' : 'ถอนเงิน'} ${amount.toLocaleString()} ฿ ใน ${item.name} สำเร็จแล้ว`,
        'success'
      );
      setAmountStr('');
      setNote('');
      onClose();
    } catch (err: any) {
      onNotify(`เกิดข้อผิดพลาด: ${err.message}`, 'info');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
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
                background: isDeposit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isDeposit ? 'var(--emerald-400)' : 'var(--rose-400)',
              }}
            >
              {isDeposit ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{title}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                มูลค่าปัจจุบัน: <strong>{item.currentValue.toLocaleString()} ฿</strong>
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} style={{ width: 30, height: 30 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Amount input */}
            <div className="form-group">
              <label>จำนวนเงิน ({isDeposit ? 'ยอดฝากเพิ่ม' : 'ยอดถอนออก'}):</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  required
                  className="form-control"
                  style={{ fontSize: '18px', fontWeight: 700, paddingRight: '45px' }}
                  placeholder="0.00"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
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

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {presets.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmountStr(p.toString())}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  +{p.toLocaleString()}
                </button>
              ))}
              {!isDeposit && item.currentValue > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountStr(item.currentValue.toString())}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--rose-400)',
                    cursor: 'pointer',
                  }}
                >
                  ถอนทั้งหมด
                </button>
              )}
            </div>

            {/* Note input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>หมายเหตุ (ถ้ามี):</label>
              <input
                type="text"
                className="form-control"
                placeholder={isDeposit ? 'เช่น เงินเดือนเข้า, ปันผล' : 'เช่น นำไปใช้จ่าย, ถอนทำกำไร'}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className={isDeposit ? 'btn btn-emerald' : 'btn btn-primary'}
              disabled={submitting}
              style={{
                background: !isDeposit ? 'var(--rose-500)' : undefined,
                borderColor: !isDeposit ? 'var(--rose-500)' : undefined,
              }}
            >
              {submitting ? 'กำลังบันทึก...' : isDeposit ? 'ยืนยันฝากเงิน' : 'ยืนยันถอนเงิน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
