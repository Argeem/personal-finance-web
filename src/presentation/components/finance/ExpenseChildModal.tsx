import React, { useState } from 'react';
import { X, Plus, CreditCard } from 'lucide-react';
import { ExpenseItem } from '../../../core/domain/ExpenseItem';

interface ExpenseChildModalProps {
  isOpen: boolean;
  parentItem: ExpenseItem | null;
  onClose: () => void;
  onSubmit: (
    parentId: string,
    child: { title: string; category?: string; monthly: number; paid: boolean }
  ) => Promise<any>;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export const ExpenseChildModal: React.FC<ExpenseChildModalProps> = ({
  isOpen,
  parentItem,
  onClose,
  onSubmit,
  onNotify,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [monthlyStr, setMonthlyStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !parentItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monthly = parseFloat(monthlyStr);
    if (!title.trim()) {
      onNotify('กรุณาระบุชื่อรายการย่อย', 'info');
      return;
    }
    if (isNaN(monthly) || monthly < 0) {
      onNotify('กรุณาระบุยอดชำระต่อเดือนที่ถูกต้อง', 'info');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parentItem.id, {
        title: title.trim(),
        category: category.trim() || 'ตัดบัตรเครดิต',
        monthly,
        paid: false,
      });
      onNotify(`เพิ่มรายการย่อย "${title.trim()}" ใน ${parentItem.title} เรียบร้อยแล้ว`, 'success');
      setTitle('');
      setCategory('');
      setMonthlyStr('');
      onClose();
    } catch (err: any) {
      onNotify(`เกิดข้อผิดพลาด: ${err.message}`, 'info');
    } finally {
      setSubmitting(false);
    }
  };

  const presets = ['ประกันชีวิต/สุขภาพ', 'Netflix', 'Spotify', 'iCloud / Apple', 'YouTube Premium', 'Disney+'];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--indigo-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                เพิ่มรายการย่อยภายใต้ {parentItem.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                รายการค่าใช้จ่ายที่ตัดรอบผ่าน {parentItem.title}
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} style={{ width: 30, height: 30 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label>ชื่อรายการย่อย:</label>
              <input
                type="text"
                autoFocus
                required
                className="form-control"
                placeholder="เช่น ประกัน, Netflix, ค่าบริการรายเดือน"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Quick Title Presets */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {presets.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setTitle(p);
                    if (p.includes('ประกัน')) setCategory('ประกันภัย/สุขภาพ');
                    else if (p.includes('iCloud') || p.includes('Apple')) setCategory('บริการคลาวด์');
                    else setCategory('บันเทิง/สตรีมมิ่ง');
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  +{p}
                </button>
              ))}
            </div>

            {/* Category */}
            <div className="form-group">
              <label>หมวดหมู่:</label>
              <input
                type="text"
                className="form-control"
                placeholder="เช่น บันเทิง/สตรีมมิ่ง, ประกันภัย, สาธารณูปโภค"
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>

            {/* Monthly amount */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>ยอดชำระต่อเดือน (บาท):</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="any"
                  required
                  className="form-control"
                  style={{ fontSize: '18px', fontWeight: 700, paddingRight: '45px' }}
                  placeholder="0.00"
                  value={monthlyStr}
                  onChange={e => setMonthlyStr(e.target.value)}
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
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Plus size={15} />
              {submitting ? 'กำลังบันทึก...' : 'เพิ่มรายการย่อย'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
