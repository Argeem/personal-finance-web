import React, { useState } from 'react';
import {
  Shield, Film, Globe, Wifi, Tv, Play, Heart,
  Landmark, Zap, Smartphone, CreditCard, Camera,
  Compass, Check, Edit2, Trash2, ChevronDown, ChevronRight,
  Plus, CornerDownRight
} from 'lucide-react';
import { ExpenseItem } from '../../../core/domain/ExpenseItem';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseTableProps {
  items: ExpenseItem[];
  onTogglePaid: (id: string, childId?: string) => void;
  onEdit: (item: ExpenseItem) => void;
  onDelete: (id: string) => void;
  onOpenAddChild?: (parent: ExpenseItem) => void;
  onDeleteChild?: (parentId: string, childId: string) => void;
}

export const renderExpenseIcon = (title: string, category: string) => {
  const t = (title + ' ' + category).toLowerCase();
  if (t.includes('ประกัน')) return <Shield size={18} />;
  if (t.includes('hbo') || t.includes('netflix') || t.includes('สตรีม')) return <Film size={18} />;
  if (t.includes('3bb') || t.includes('เน็ต') || t.includes('wifi')) return <Wifi size={18} />;
  if (t.includes('internet') || t.includes('เว็บ')) return <Globe size={18} />;
  if (t.includes('true vision') || t.includes('tv') || t.includes('โทรทัศน์')) return <Tv size={18} />;
  if (t.includes('youtube')) return <Play size={18} />;
  if (t.includes('ครอบครัว')) return <Heart size={18} />;
  if (t.includes('ที่ดิน')) return <Landmark size={18} />;
  if (t.includes('ไฟ') || t.includes('น้ำ')) return <Zap size={18} />;
  if (t.includes('กล้อง') || t.includes('ace pro')) return <Camera size={18} />;
  if (t.includes('17t') || t.includes('phone') || t.includes('มือถือ')) return <Smartphone size={18} />;
  if (t.includes('credit card') || t.includes('บัตร')) return <CreditCard size={18} />;
  return <Compass size={18} />;
};

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  items,
  onTogglePaid,
  onEdit,
  onDelete,
  onOpenAddChild,
  onDeleteChild,
}) => {
  // Keep parent items collapsed by default as requested
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedParents(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
        ไม่พบรายการที่ตรงกับเงื่อนไข
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="finance-table">
        <thead>
          <tr>
            <th style={{ width: '60px', textAlign: 'center' }}>สถานะ</th>
            <th>รายการ</th>
            <th>หมวดหมู่ / ช่องทาง</th>
            <th style={{ textAlign: 'right' }}>ยอดชำระเดือนนี้</th>
            <th style={{ textAlign: 'right' }}>เงินต้น</th>
            <th style={{ textAlign: 'right' }}>หนี้คงเหลือ</th>
            <th style={{ textAlign: 'center' }}>งวดผ่อน</th>
            <th>ความคืบหน้า</th>
            <th>ประเภท</th>
            <th style={{ textAlign: 'center', width: '90px' }}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const hasChildren = !!(item.children && item.children.length > 0);
            const isCreditCardParent = item.title.includes('บัตรเครดิต') || hasChildren;
            const isExpanded = expandedParents[item.id] ?? false;
            const isPaid = item.paid;
            
            const instMatch = item.installment ? item.installment.match(/^(\d+)\s*(?:\/|\s)\s*(\d+)$/) : null;
            const installmentPct = instMatch && parseInt(instMatch[2], 10) > 0
              ? Math.round((parseInt(instMatch[1], 10) / parseInt(instMatch[2], 10)) * 100)
              : 0;

            const progressPct =
              item.principal > 0
                ? Math.min(100, Math.max(0, Math.round(((item.principal - item.remaining) / item.principal) * 100)))
                : installmentPct;

            const displayMonthly = hasChildren
              ? item.children!.reduce((sum, c) => sum + (Number(c.monthly) || 0), 0)
              : item.monthly;

            return (
              <React.Fragment key={item.id}>
                {/* Main Item Row - Clicking row toggles expand/collapse */}
                <tr
                  className={`${isPaid ? 'row-paid' : ''} ${hasChildren ? 'row-parent-group' : ''}`}
                  onClick={() => {
                    if (hasChildren) toggleExpand(item.id);
                  }}
                  style={{
                    background: hasChildren
                      ? isExpanded
                        ? 'rgba(99, 102, 241, 0.05)'
                        : 'rgba(99, 102, 241, 0.02)'
                      : undefined,
                    cursor: hasChildren ? 'pointer' : undefined,
                  }}
                  title={hasChildren ? (isExpanded ? 'คลิกที่แถวเพื่อย่อ' : 'คลิกที่แถวเพื่อขยาย') : undefined}
                >
                  <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className={`checkbox-btn ${isPaid ? 'checked' : ''}`}
                      onClick={() => onTogglePaid(item.id)}
                      title={isPaid ? 'เปลี่ยนเป็นยังไม่ชำระ' : 'ทำเครื่องหมายว่าชำระแล้ว'}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                  </td>

                  <td>
                    <div className="item-cell">
                      <div className="item-icon-box">{renderExpenseIcon(item.title, item.category)}</div>
                      <div className="item-title-grp">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="item-name" style={{ fontWeight: hasChildren ? 800 : undefined }}>
                            {item.title}
                          </span>
                          {hasChildren && (
                            <span
                              className="badge"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: 'var(--indigo-400)',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '1px 7px',
                                borderRadius: 'var(--radius-full)',
                              }}
                            >
                              {isExpanded ? <ChevronDown size={11} strokeWidth={2.5} /> : <ChevronRight size={11} strokeWidth={2.5} />}
                              <span>{item.children!.length}</span>
                            </span>
                          )}
                        </div>
                        <div className="item-cat">{item.category || '-'}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`badge ${item.type === 'debt' ? 'badge-debt' : 'badge-sub'}`}>
                      {item.category || '-'}
                    </span>
                  </td>

                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: isPaid ? 'var(--emerald-400)' : 'var(--text-main)',
                    }}
                  >
                    {formatCurrency(displayMonthly)}
                  </td>

                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {item.principal > 0 ? formatCurrency(item.principal) : '-'}
                  </td>

                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: item.remaining > 0 ? 'var(--amber-400)' : 'var(--text-muted)',
                    }}
                  >
                    {item.remaining > 0 ? formatCurrency(item.remaining) : '-'}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        background: 'var(--bg-surface-elevated)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {item.installment || 'รายเดือน'}
                    </span>
                  </td>

                  <td>
                    {(item.principal > 0 || Boolean(instMatch)) ? (
                      <div className="mini-progress-wrap">
                        <div className="mini-progress-bar">
                          <div className="mini-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                        <div className="mini-progress-text">
                          <span>{progressPct}%</span>
                          <span>{item.installment}</span>
                        </div>
                      </div>
                    ) : hasChildren ? (
                      <span style={{ color: 'var(--indigo-400)', fontSize: '12px', fontWeight: 600 }}>
                        ตัดรวมรอบบัตร
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>รายจ่ายประจำ</span>
                    )}
                  </td>

                  <td>
                    <span className={`badge ${isPaid ? 'badge-paid' : 'badge-pending'}`}>
                      {isPaid ? '✅ ชำระแล้ว' : '⏳ รอชำระ'}
                    </span>
                  </td>

                  <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      {isCreditCardParent && onOpenAddChild && (
                        <button
                          type="button"
                          className="icon-btn btn-sm"
                          onClick={() => onOpenAddChild(item)}
                          title="เพิ่มรายการย่อย (Add Child)"
                          style={{
                            color: 'var(--sky-400)',
                            background: 'rgba(14, 165, 233, 0.1)',
                            border: '1px solid rgba(14, 165, 233, 0.25)',
                          }}
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="icon-btn btn-sm"
                        onClick={() => onEdit(item)}
                        title="แก้ไข"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn btn-sm"
                        onClick={() => onDelete(item.id)}
                        title="ลบ"
                        style={{ color: 'var(--rose-400)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Nested Child Rows - Only parent has checkbox */}
                {hasChildren && isExpanded && item.children!.map(child => (
                  <tr
                    key={child.id}
                    className={`row-child ${isPaid ? 'row-paid' : ''}`}
                    style={{
                      background: 'rgba(99, 102, 241, 0.04)',
                      borderLeft: '3px solid var(--indigo-400)',
                    }}
                  >
                    <td></td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '20px' }}>
                        <CornerDownRight size={14} style={{ color: 'var(--indigo-400)', flexShrink: 0 }} />
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            textDecoration: isPaid ? 'line-through' : 'none',
                            opacity: isPaid ? 0.7 : 1,
                          }}
                        >
                          {child.title}
                        </span>
                        {child.category && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            • {child.category}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-sub" style={{ fontSize: '11px', opacity: 0.85 }}>
                        {child.category || 'ตัดบัตร'}
                      </span>
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        fontSize: '13px',
                        color: isPaid ? 'var(--emerald-400)' : 'var(--text-main)',
                      }}
                    >
                      {formatCurrency(child.monthly)}
                    </td>

                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>-</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>-</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>ตัดรอบบัตร</td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>หักผ่าน {item.title}</span>
                    </td>

                    <td>
                      <span className={`badge ${isPaid ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: '11px' }}>
                        {isPaid ? '✅ ชำระแล้ว' : '⏳ รอตัดรอบ'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {onDeleteChild && (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => onDeleteChild(item.id, child.id)}
                            title={`ลบ ${child.title}`}
                            style={{
                              color: 'var(--rose-400)',
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              background: 'rgba(244, 63, 94, 0.08)',
                              border: '1px solid rgba(244, 63, 94, 0.25)',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
