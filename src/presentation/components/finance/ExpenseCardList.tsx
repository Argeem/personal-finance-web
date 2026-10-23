import React, { useState } from 'react';
import { Check, Edit2, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { ExpenseItem } from '../../../core/domain/ExpenseItem';
import { formatCurrency } from '../../utils/formatters';
import { renderExpenseIcon } from './ExpenseTable';

interface ExpenseCardListProps {
  items: ExpenseItem[];
  onTogglePaid: (id: string, childId?: string) => void;
  onEdit: (item: ExpenseItem) => void;
  onDelete: (id: string) => void;
  onOpenAddChild?: (parent: ExpenseItem) => void;
  onDeleteChild?: (parentId: string, childId: string) => void;
}

export const ExpenseCardList: React.FC<ExpenseCardListProps> = ({
  items,
  onTogglePaid,
  onEdit,
  onDelete,
  onOpenAddChild,
  onDeleteChild,
}) => {
  // Default collapsed as requested
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
        ไม่พบรายการ
      </div>
    );
  }

  return (
    <div className="mobile-card-list">
      {items.map(item => {
        const isPaid = item.paid;
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isExpanded = expandedIds[item.id] ?? false;

        return (
          <div key={item.id} className={`m-finance-card ${isPaid ? 'paid' : ''}`}>
            <div
              className="m-card-top"
              onClick={() => hasChildren && toggleExpand(item.id)}
              style={{ cursor: hasChildren ? 'pointer' : undefined }}
            >
              <div className="m-card-info">
                <button
                  type="button"
                  className={`checkbox-btn ${isPaid ? 'checked' : ''}`}
                  onClick={e => {
                    e.stopPropagation();
                    onTogglePaid(item.id);
                  }}
                  title={isPaid ? 'ทำเครื่องหมายว่ายังไม่จ่าย' : 'ทำเครื่องหมายว่าจ่ายแล้ว'}
                >
                  <Check size={16} strokeWidth={3} />
                </button>
                <div className="item-title-grp">
                  <div
                    className="item-name"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: isPaid ? 'line-through' : 'none',
                      opacity: isPaid ? 0.7 : 1,
                    }}
                  >
                    <span>{renderExpenseIcon(item.title, item.category)}</span>
                    <span>{item.title}</span>
                    {hasChildren && (
                      <span
                        className="badge"
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'var(--indigo-300)',
                          borderRadius: 'var(--radius-full)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        {item.children?.length}
                      </span>
                    )}
                  </div>
                  <div className="item-cat">
                    {item.category || '-'} • {item.installment || 'รายเดือน'}
                  </div>
                </div>
              </div>

              <div className="m-card-amount-box">
                <div
                  className="m-card-due"
                  style={{ color: isPaid ? 'var(--emerald-400)' : 'var(--text-main)' }}
                >
                  {formatCurrency(item.monthly)}
                </div>
                <span className={`badge ${isPaid ? 'badge-paid' : 'badge-pending'}`} style={{ marginTop: '4px' }}>
                  {isPaid ? 'ชำระแล้ว' : 'รอชำระ'}
                </span>
              </div>
            </div>

            {item.principal > 0 && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>เงินต้น: {formatCurrency(item.principal)}</span>
                <span>
                  คงเหลือ: <strong style={{ color: 'var(--amber-400)' }}>{formatCurrency(item.remaining)}</strong>
                </span>
              </div>
            )}

            {/* If parent item has children or can accept children */}
            {(hasChildren || onOpenAddChild) && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.15)',
                  borderRadius: '8px',
                  padding: '8px',
                  marginTop: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: isExpanded && hasChildren ? '8px' : 0,
                  }}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        padding: 0,
                      }}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>รายการย่อย ({item.children?.length || 0})</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ไม่มีรายการย่อย</span>
                  )}
                </div>

                {/* Sub list of children */}
                {isExpanded && hasChildren && item.children && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.children.map(child => (
                      <div
                        key={child.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          background: 'var(--bg-card)',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--indigo-400)', fontWeight: 700 }}>↳</span>
                          <span
                            style={{
                              textDecoration: isPaid ? 'line-through' : 'none',
                              color: isPaid ? 'var(--text-muted)' : 'var(--text-main)',
                              fontWeight: 500,
                              opacity: isPaid ? 0.7 : 1,
                            }}
                          >
                            {child.title}
                          </span>
                          {child.category && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              ({child.category})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: isPaid ? 'var(--emerald-400)' : 'var(--text-main)',
                            }}
                          >
                            {formatCurrency(child.monthly)}
                          </span>
                          {onDeleteChild && (
                            <button
                              type="button"
                              onClick={() => onDeleteChild(item.id, child.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--rose-400)',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="ลบรายการย่อย"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {item.type === 'debt' ? 'หนี้ผ่อน' : 'Subscription'}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                {(item.title.includes('บัตรเครดิต') || Boolean(item.children && item.children.length > 0)) && onOpenAddChild && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenAddChild(item)}
                    style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--sky-400)' }}
                    title="เพิ่มรายการย่อย"
                  >
                    <Plus size={12} /> +
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onEdit(item)}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  <Edit2 size={12} /> แก้ไข
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onDelete(item.id)}
                  style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--rose-400)' }}
                >
                  <Trash2 size={12} /> ลบ
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

