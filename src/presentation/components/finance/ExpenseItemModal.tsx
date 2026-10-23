import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ExpenseItem, ExpenseType } from '../../../core/domain/ExpenseItem';

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
  const [installment, setInstallment] = useState('');

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title);
      setType(initialItem.type);
      setCategory(initialItem.category);
      setMonthly(initialItem.monthly);
      setPrincipal(initialItem.principal || '');
      setRemaining(initialItem.remaining || '');
      setInstallment(initialItem.installment || '');
    } else {
      setTitle('');
      setType('subscription');
      setCategory('');
      setMonthly('');
      setPrincipal('');
      setRemaining('');
      setInstallment('รายเดือน');
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialItem ? initialItem.id : undefined,
      title: title.trim(),
      type,
      category: category.trim(),
      monthly: Number(monthly) || 0,
      principal: type === 'debt' ? Number(principal) || 0 : 0,
      remaining: type === 'debt' ? Number(remaining) || 0 : 0,
      installment: installment.trim() || (type === 'debt' ? '1 / 10' : 'รายเดือน'),
      paid: initialItem ? initialItem.paid : false,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
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
                onChange={e => setMonthly(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
              />
            </div>

            {type === 'debt' && (
              <>
                <div className="form-group">
                  <label>เงินต้นทั้งหมด (บาท):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={principal}
                    onChange={e => setPrincipal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>หนี้คงเหลือสุทธิ (บาท):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={remaining}
                    onChange={e => setRemaining(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>งวดผ่อน (เช่น 5 / 12 หรือ 1 / 10):</label>
                  <input
                    type="text"
                    className="form-control"
                    value={installment}
                    onChange={e => setInstallment(e.target.value)}
                    placeholder="เช่น 1 / 10"
                  />
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
