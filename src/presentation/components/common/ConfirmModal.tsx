import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemTitle?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemTitle,
  confirmText = 'ยืนยันการลบ',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 120 }}>
      <div
        className="modal-box"
        style={{ maxWidth: '440px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: variant === 'danger' ? 'var(--rose-bg)' : 'var(--amber-bg)',
                border: `1px solid ${variant === 'danger' ? 'var(--rose-border)' : 'var(--amber-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: variant === 'danger' ? 'var(--rose-400)' : 'var(--amber-400)',
                flexShrink: 0,
              }}
            >
              {variant === 'danger' ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onCancel}
            style={{ width: 32, height: 32 }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ paddingTop: '16px', paddingBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {message}
          </p>

          {itemTitle && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px 14px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📌 รายการ:</span>
              <strong style={{ color: variant === 'danger' ? 'var(--rose-400)' : 'var(--amber-400)' }}>
                {itemTitle}
              </strong>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ minWidth: '85px' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              background: variant === 'danger' ? 'var(--rose-500)' : 'var(--amber-500)',
              color: 'white',
              minWidth: '110px',
              boxShadow:
                variant === 'danger'
                  ? '0 2px 10px rgba(239, 68, 68, 0.35)'
                  : '0 2px 10px rgba(245, 158, 11, 0.35)',
            }}
          >
            {variant === 'danger' && <Trash2 size={15} />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
