import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Sparkles } from 'lucide-react';
import { LandInstallment } from '../../../core/domain/LandInstallment';
import { formatCurrency } from '../../utils/formatters';

interface LandPayModalProps {
  isOpen: boolean;
  installment: LandInstallment | null;
  onClose: () => void;
  onConfirm: (period: number, amount: number, paid: boolean, note?: string) => void;
}

export const LandPayModal: React.FC<LandPayModalProps> = ({
  isOpen,
  installment,
  onClose,
  onConfirm,
}) => {
  const [amount, setAmount] = useState<number | ''>(10000);
  const [note, setNote] = useState('');
  const [paid, setPaid] = useState(true);

  useEffect(() => {
    if (installment) {
      // Default to 10,000 if not set or 0
      const currentAmount =
        installment.amount > 0
          ? installment.amount
          : installment.plannedAmount && installment.plannedAmount > 0
          ? installment.plannedAmount
          : 10000;

      setAmount(currentAmount);
      setNote(installment.note || '');
      // If already paid, keep paid=true; if not paid, default to true for quick logging
      setPaid(installment.paid ?? true);
    }
  }, [installment, isOpen]);

  if (!isOpen || !installment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = amount === '' || Number(amount) <= 0 ? 10000 : Number(amount);
    onConfirm(installment.period, finalAmount, paid, note.trim());
    onClose();
  };

  const quickPresets = [
    { label: '฿10,000 (ปกติ)', value: 10000 },
    { label: '฿7,600', value: 7600 },
    { label: '฿5,000', value: 5000 },
    { label: '฿12,000 (โปะ)', value: 12000 },
    { label: '฿15,000 (โปะ)', value: 15000 },
    { label: '฿20,000 (โปะ 2 เท่า)', value: 20000 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏞️ งวดที่ {installment.period} - บันทึก / แก้ไขค่างวด</span>
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Installment Info Banner */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  งวดที่ {installment.period} / 72 ({installment.month} {installment.year})
                </div>
                <div style={{ fontSize: '12px', color: 'var(--amber-400)', marginTop: '2px' }}>
                  รอบบิล: 21 ถึง 20 ของเดือน
                </div>
              </div>
              <span className={`badge ${installment.paid ? 'badge-paid' : 'badge-pending'}`}>
                {installment.paid ? '✅ ชำระแล้ว' : '⏳ รอชำระ'}
              </span>
            </div>

            {/* Amount Field with Default 10,000 & Quick Preset Chips */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0, fontWeight: 700 }}>จำนวนเงินค่างวด (บาท):</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAmount(10000)}
                  style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="คืนค่าเป็น 10,000 บาท"
                >
                  <RotateCcw size={11} /> คืนค่า ฿10,000
                </button>
              </div>

              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                required
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="10000"
                style={{ fontSize: '18px', fontWeight: 700, color: 'var(--emerald-400)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                💡 <strong>ค่าเริ่มต้นคือ ฿10,000</strong> สามารถแก้ไขเป็นยอดที่ต้องการได้ (เช่น จ่ายบางส่วน หรือจ่ายโปะเพิ่ม)
              </span>

              {/* Quick Presets */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} color="var(--amber-400)" /> ปรับยอดยอดนิยม:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {quickPresets.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`pill-btn ${amount === preset.value ? 'active' : ''}`}
                      onClick={() => setAmount(preset.value)}
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Note Field */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>หมายเหตุเพิ่มเติม (ถ้ามี):</label>
              <input
                type="text"
                className="form-control"
                placeholder="เช่น โอนผ่าน KBank, จ่ายตรงรอบ, โปะเพิ่ม"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {/* Paid Status Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginTop: '12px',
              }}
            >
              <input
                type="checkbox"
                id="landPaidToggle"
                checked={paid}
                onChange={e => setPaid(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--emerald-500)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="landPaidToggle" style={{ cursor: 'pointer', margin: 0, fontSize: '13px' }}>
                  ทำเครื่องหมายว่า <strong>ชำระแล้ว ({formatCurrency(amount || 10000)})</strong>
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {paid ? 'จะบันทึกสถานะว่าจ่ายเงินงวดนี้แล้ว' : 'จะบันทึกเฉพาะยอดเงินที่จะจ่ายล่วงหน้า (ยังไม่ตัดจ่าย)'}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className={`btn ${paid ? 'btn-emerald' : 'btn-primary'}`}>
              {paid
                ? `✓ ยืนยันชำระเงิน (${formatCurrency(amount || 10000)})`
                : `💾 บันทึกยอดเงินที่จะจ่าย (${formatCurrency(amount || 10000)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
