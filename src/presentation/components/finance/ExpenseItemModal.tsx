import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, RefreshCw, Calculator, Percent } from 'lucide-react';
import { ExpenseItem, ExpenseType } from '../../../core/domain/ExpenseItem';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<ExpenseItem>) => void;
  initialItem?: ExpenseItem | null;
}

export const ExpenseItemModal: React.FC<ExpenseItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ExpenseType>('subscription');
  const [category, setCategory] = useState('');
  const [monthly, setMonthly] = useState<number | ''>('');
  const [principal, setPrincipal] = useState<number | ''>('');
  const [remaining, setRemaining] = useState<number | ''>('');

  // Installment specific states (e.g. 6 / 10 -> currentMonth = 6, totalMonths = 10)
  const [currentMonth, setCurrentMonth] = useState<number>(1);
  const [totalMonths, setTotalMonths] = useState<number>(10);
  const [autoCalcRemaining, setAutoCalcRemaining] = useState<boolean>(true);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title);
      setType(initialItem.type);
      setCategory(initialItem.category);
      setMonthly(initialItem.monthly);
      setPrincipal(initialItem.principal || '');
      setRemaining(initialItem.remaining ?? '');

      const inst = initialItem.installment || '';
      const match = inst.match(/^(\d+)\s*(?:\/|\s)\s*(\d+)$/);
      if (match) {
        setCurrentMonth(parseInt(match[1], 10));
        setTotalMonths(parseInt(match[2], 10));
      } else {
        setCurrentMonth(1);
        setTotalMonths(10);
      }
    } else {
      setTitle('');
      setType('subscription');
      setCategory('');
      setMonthly('');
      setPrincipal('');
      setRemaining('');
      setCurrentMonth(1);
      setTotalMonths(10);
      setAutoCalcRemaining(true);
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  // Helper to calculate remaining debt based on installments
  const calculateRemainingDebt = (curr: number, total: number, mon: number | '', princ: number | '') => {
    const m = Number(mon) || 0;
    const p = Number(princ) || 0;
    const remMonths = Math.max(0, total - curr);

    if (m > 0) {
      return Math.max(0, Math.round(remMonths * m * 100) / 100);
    } else if (p > 0 && total > 0) {
      return Math.max(0, Math.round((remMonths * (p / total)) * 100) / 100);
    }
    return 0;
  };

  // Live progress percentage calculation
  const calculateProgressPercent = () => {
    const numPrincipal = Number(principal);
    const numRemaining = Number(remaining);
    if (numPrincipal > 0 && remaining !== '') {
      return Math.min(100, Math.max(0, Math.round(((numPrincipal - numRemaining) / numPrincipal) * 100)));
    }
    if (totalMonths > 0) {
      return Math.min(100, Math.max(0, Math.round((currentMonth / totalMonths) * 100)));
    }
    return 0;
  };

  const progressPercent = calculateProgressPercent();

  // Change current month (e.g. from 6 to 5)
  const handleCurrentMonthChange = (newCurrent: number) => {
    const val = Math.max(0, newCurrent);
    setCurrentMonth(val);

    if (autoCalcRemaining) {
      const updatedRemaining = calculateRemainingDebt(val, totalMonths, monthly, principal);
      setRemaining(updatedRemaining);
    }
  };

  // Change total months (e.g. from 10 to 12)
  const handleTotalMonthsChange = (newTotal: number) => {
    const val = Math.max(1, newTotal);
    setTotalMonths(val);

    if (autoCalcRemaining) {
      const updatedRemaining = calculateRemainingDebt(currentMonth, val, monthly, principal);
      setRemaining(updatedRemaining);
    }
  };

  // Quick preset button for total months
  const applyPresetMonths = (months: number) => {
    setTotalMonths(months);
    const newCurr = Math.min(currentMonth, months);
    setCurrentMonth(newCurr);

    if (autoCalcRemaining) {
      const updatedRemaining = calculateRemainingDebt(newCurr, months, monthly, principal);
      setRemaining(updatedRemaining);
    }
  };

  // Manually force auto-calculation of remaining balance
  const handleForceRecalc = () => {
    const updatedRemaining = calculateRemainingDebt(currentMonth, totalMonths, monthly, principal);
    setRemaining(updatedRemaining);
  };

  // Auto-fill principal if missing
  const handleAutoFillPrincipal = () => {
    const m = Number(monthly) || 0;
    if (m > 0 && totalMonths > 0) {
      const calcPrincipal = Math.round(m * totalMonths * 100) / 100;
      setPrincipal(calcPrincipal);
      if (autoCalcRemaining) {
        setRemaining(calculateRemainingDebt(currentMonth, totalMonths, m, calcPrincipal));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const installmentStr = type === 'debt' ? `${currentMonth} / ${totalMonths}` : 'รายเดือน';

    onSave({
      id: initialItem ? initialItem.id : undefined,
      title: title.trim(),
      type,
      category: category.trim(),
      monthly: Number(monthly) || 0,
      principal: type === 'debt' ? Number(principal) || 0 : 0,
      remaining: type === 'debt' ? Number(remaining) || 0 : 0,
      installment: installmentStr,
      paid: initialItem ? initialItem.paid : false,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
            {initialItem ? `แก้ไข: ${initialItem.title}` : 'เพิ่มรายการใหม่'}
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>ชื่อรายการ (เช่น Netflix, ผ่อนทีวี):</label>
              <input
                type="text"
                className="form-control"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="ระบุชื่อรายการ"
              />
            </div>

            <div className="form-group">
              <label>ประเภทรายการ:</label>
              <select
                className="form-control"
                value={type}
                onChange={e => setType(e.target.value as ExpenseType)}
              >
                <option value="subscription">Subscription รายเดือน / บิลประจำ</option>
                <option value="debt">หนี้สินผ่อนชำระ (เช่น บัตรเครดิต, สินค้า)</option>
              </select>
            </div>

            <div className="form-group">
              <label>หมวดหมู่ / ช่องทาง:</label>
              <input
                type="text"
                className="form-control"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="เช่น Shopee, บัตรเครดิต, สาธารณูปโภค"
              />
            </div>

            <div className="form-group">
              <label>ยอดชำระเดือนนี้ (บาท):</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                required
                value={monthly}
                onChange={e => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setMonthly(val);
                  if (autoCalcRemaining && type === 'debt') {
                    setRemaining(calculateRemainingDebt(currentMonth, totalMonths, val, principal));
                  }
                }}
                placeholder="0.00"
              />
            </div>

            {type === 'debt' && (
              <>
                {/* Installment Month Stepper Box */}
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    marginTop: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <label style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
                      📅 งวดผ่อนชำระ (เช่น 5 / 10):
                    </label>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: 'var(--indigo-400)',
                        fontWeight: 800,
                        fontSize: '12px',
                        padding: '2px 8px',
                      }}
                    >
                      {currentMonth} / {totalMonths} งวด ({progressPercent}%)
                    </span>
                  </div>

                  {/* Dual Inputs with Steppers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        งวดที่ผ่อนแล้ว:
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCurrentMonthChange(currentMonth - 1)}
                          disabled={currentMonth <= 0}
                          style={{ padding: '6px 10px', minWidth: '32px' }}
                          title="ลด 1 งวด"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={totalMonths}
                          className="form-control"
                          value={currentMonth}
                          onChange={e => handleCurrentMonthChange(parseInt(e.target.value, 10) || 0)}
                          style={{ textAlign: 'center', fontWeight: 700 }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCurrentMonthChange(currentMonth + 1)}
                          disabled={currentMonth >= totalMonths}
                          style={{ padding: '6px 10px', minWidth: '32px' }}
                          title="เพิ่ม 1 งวด"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-muted)', paddingTop: '16px' }}>
                      /
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        จำนวนงวดทั้งหมด:
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleTotalMonthsChange(totalMonths - 1)}
                          disabled={totalMonths <= 1}
                          style={{ padding: '6px 10px', minWidth: '32px' }}
                          title="ลดงวดทั้งหมด"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          value={totalMonths}
                          onChange={e => handleTotalMonthsChange(parseInt(e.target.value, 10) || 1)}
                          style={{ textAlign: 'center', fontWeight: 700 }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleTotalMonthsChange(totalMonths + 1)}
                          style={{ padding: '6px 10px', minWidth: '32px' }}
                          title="เพิ่มงวดทั้งหมด"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preset quick buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>เลือกงวดด่วน:</span>
                    {[3, 6, 10, 12, 18, 24, 36].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => applyPresetMonths(m)}
                        className={`badge ${totalMonths === m ? 'badge-debt' : ''}`}
                        style={{
                          cursor: 'pointer',
                          border: totalMonths === m ? '1px solid var(--indigo-500)' : '1px solid var(--border-subtle)',
                          background: totalMonths === m ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                          color: totalMonths === m ? 'var(--indigo-300)' : 'var(--text-muted)',
                          padding: '3px 8px',
                          fontSize: '11px',
                        }}
                      >
                        {m} เดือน
                      </button>
                    ))}
                  </div>

                  {/* Live Progress Bar and Calculation Preview */}
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 12px',
                      background: 'rgba(99, 102, 241, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--indigo-300)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Percent size={13} /> ความคืบหน้า: {progressPercent}%
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ชำระแล้ว {currentMonth} จาก {totalMonths} งวด (เหลืออีก {Math.max(0, totalMonths - currentMonth)} งวด)
                      </span>
                    </div>

                    <div className="mini-progress-bar" style={{ height: '7px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        className="mini-progress-fill"
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--indigo-500) 0%, var(--emerald-500) 100%)',
                          transition: 'width 0.25s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Principal and Remaining Inputs */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>เงินต้นทั้งหมด (บาท):</label>
                    {(!principal || principal === 0) && monthly && (
                      <button
                        type="button"
                        onClick={handleAutoFillPrincipal}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--sky-400)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Calculator size={11} /> คำนวณเงินต้น ({formatCurrency((Number(monthly) || 0) * totalMonths)})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={principal}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setPrincipal(val);
                      if (autoCalcRemaining) {
                        setRemaining(calculateRemainingDebt(currentMonth, totalMonths, monthly, val));
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>หนี้คงเหลือสุทธิ (บาท):</label>
                    <button
                      type="button"
                      onClick={handleForceRecalc}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--indigo-400)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      title="คำนวณยอดหนี้คงเหลือตามงวดผ่อนที่ระบุ"
                    >
                      <RefreshCw size={11} /> คำนวณจากงวด ({formatCurrency(calculateRemainingDebt(currentMonth, totalMonths, monthly, principal))})
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={remaining}
                    onChange={e => setRemaining(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      id="autoCalcRemaining"
                      checked={autoCalcRemaining}
                      onChange={e => setAutoCalcRemaining(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: 'var(--indigo-500)' }}
                    />
                    <label htmlFor="autoCalcRemaining" style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, cursor: 'pointer' }}>
                      คำนวณยอดหนี้คงเหลือให้อัตโนมัติเมื่อเปลี่ยนงวด
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary">
              บันทึกรายการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
