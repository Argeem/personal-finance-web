import React, { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { ExpenseItem } from '../../core/domain/ExpenseItem';
import { FinanceMetrics } from '../../core/domain/ExpenseItem';
import { FinanceKPIGrid } from '../components/finance/FinanceKPIGrid';
import { ExpenseToolbar } from '../components/finance/ExpenseToolbar';
import { ExpenseTable } from '../components/finance/ExpenseTable';
import { ExpenseCardList } from '../components/finance/ExpenseCardList';
import { ExpenseItemModal } from '../components/finance/ExpenseItemModal';
import { ExpenseChildModal } from '../components/finance/ExpenseChildModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrency } from '../utils/formatters';

interface FinanceDashboardViewProps {
  items: ExpenseItem[];
  filteredItems: ExpenseItem[];
  metrics: FinanceMetrics;
  filter: 'all' | 'pending' | 'paid' | 'subscription' | 'debt';
  onFilterChange: (f: 'all' | 'pending' | 'paid' | 'subscription' | 'debt') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onTogglePaid: (id: string, childId?: string) => void;
  onAddItem: (item: Omit<ExpenseItem, 'id'>) => Promise<ExpenseItem>;
  onEditItem: (id: string, updates: Partial<ExpenseItem>) => Promise<ExpenseItem>;
  onDeleteItem: (id: string) => void;
  onAddChild?: (
    parentId: string,
    child: { title: string; category?: string; monthly: number; paid: boolean }
  ) => Promise<any>;
  onDeleteChild?: (parentId: string, childId: string) => Promise<any> | any;
  onResetMonthlyChecks: () => void;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({
  items,
  filteredItems,
  metrics,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onTogglePaid,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAddChild,
  onDeleteChild,
  onResetMonthlyChecks,
  onNotify,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ExpenseItem | null>(null);
  const [childModalParent, setChildModalParent] = useState<ExpenseItem | null>(null);
  const [deletingChild, setDeletingChild] = useState<{ parentId: string; childId: string; title: string } | null>(null);
  const [isResetMonthOpen, setIsResetMonthOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExpenseItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (id: string) => {
    const target = items.find(i => i.id === id);
    if (target) {
      setDeletingItem(target);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      onDeleteItem(deletingItem.id);
      onNotify(`ลบรายการ "${deletingItem.title}" เรียบร้อยแล้ว`, 'info');
      setDeletingItem(null);
    }
  };

  const handleSaveItem = async (data: Partial<ExpenseItem>) => {
    if (editingItem) {
      await onEditItem(editingItem.id, data);
      onNotify(`อัปเดต "${data.title}" สำเร็จ`, 'success');
    } else {
      await onAddItem(data as Omit<ExpenseItem, 'id'>);
      onNotify(`เพิ่มรายการ "${data.title}" สำเร็จ`, 'success');
    }
  };

  const handleExportCsv = () => {
    const headers = ['สถานะ', 'รายการ', 'หมวดหมู่', 'ยอดชำระเดือนนี้', 'เงินต้น', 'หนี้คงเหลือ', 'งวดผ่อน', 'ประเภท'];
    const rows = items.map(item => [
      item.paid ? 'ชำระแล้ว' : 'รอชำระ',
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      item.monthly || 0,
      item.principal || 0,
      item.remaining || 0,
      `"${item.installment || 'รายเดือน'}"`,
      item.type === 'debt' ? 'ผ่อนชำระ' : 'Subscription',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Finance_UI_Monthly_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('ส่งออกไฟล์ CSV สำเร็จ', 'success');
  };

  const handleOpenAddChild = (parent: ExpenseItem) => {
    setChildModalParent(parent);
  };

  const handleRequestDeleteChild = (parentId: string, childId: string) => {
    const parent = items.find(i => i.id === parentId);
    const child = parent?.children?.find(c => c.id === childId);
    if (child) {
      setDeletingChild({ parentId, childId, title: child.title });
    } else if (onDeleteChild) {
      onDeleteChild(parentId, childId);
    }
  };

  const handleConfirmDeleteChild = async () => {
    if (deletingChild && onDeleteChild) {
      await onDeleteChild(deletingChild.parentId, deletingChild.childId);
      onNotify(`ลบรายการย่อย "${deletingChild.title}" เรียบร้อยแล้ว`, 'info');
      setDeletingChild(null);
    }
  };

  const handleConfirmResetMonth = () => {
    onResetMonthlyChecks();
    setIsResetMonthOpen(false);
    onNotify('รีเซ็ตสถานะรอบบิลใหม่สำเร็จ เริ่มต้นเช็กลิสต์เดือนใหม่ได้เลย!', 'success');
  };

  return (
    <div>
      {/* Section Header */}
      <div className="section-header">
        <div className="section-title-wrap">
          <h2>
            <span>📊 แดชบอร์ดจัดการการเงินส่วนบุคคล</span>
            <span className="period-badge">รอบบิลปัจจุบัน</span>
          </h2>
          <p>จัดการรายจ่ายประจำเดือน ตรวจสอบสถานะการชำระ และติดตามภาระหนี้สินคงค้าง</p>
        </div>

        <div className="section-controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsResetMonthOpen(true)}
            title="รีเซ็ตสถานะเพื่อเริ่มรอบเดือนใหม่"
          >
            <RotateCcw size={14} />
            เริ่มรอบเดือนใหม่
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAdd}
          >
            <Plus size={14} />
            + เพิ่มรายการ
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <FinanceKPIGrid metrics={metrics} />

      {/* Checklist & Table Section */}
      <div className="data-card">
        <ExpenseToolbar
          filter={filter}
          onFilterChange={onFilterChange}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          items={items}
          onExportCsv={handleExportCsv}
        />

        {/* Desktop Table */}
        <ExpenseTable
          items={filteredItems}
          onTogglePaid={onTogglePaid}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
          onOpenAddChild={handleOpenAddChild}
          onDeleteChild={handleRequestDeleteChild}
        />

        {/* Mobile Cards */}
        <ExpenseCardList
          items={filteredItems}
          onTogglePaid={onTogglePaid}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
          onOpenAddChild={handleOpenAddChild}
          onDeleteChild={handleRequestDeleteChild}
        />

        {/* Table Summary Bar */}
        <div className="table-summary-bar">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="label">ยอดชำระเดือนนี้รวม</span>
              <span className="val">{formatCurrency(metrics.monthTotal)}</span>
            </div>
            <div className="stat-item">
              <span className="label">ยอดเงินต้นรวม</span>
              <span className="val">{formatCurrency(metrics.totalPrincipalDebt)}</span>
            </div>
            <div className="stat-item">
              <span className="label">หนี้คงเหลือรวม</span>
              <span className="val">{formatCurrency(metrics.totalOutstandingDebt)}</span>
            </div>
          </div>

          <div className="summary-stats">
            <div className="stat-item">
              <span className="label">ความคืบหน้าการชำระ</span>
              <span className="val" style={{ color: 'var(--emerald-400)' }}>
                ชำระแล้ว {metrics.paidItemsCount}/{metrics.totalItemsCount} รายการ ({formatCurrency(metrics.monthPaidTotal)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <ExpenseItemModal
        isOpen={isModalOpen}
        initialItem={editingItem}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
      />

      {/* Add Child Modal */}
      <ExpenseChildModal
        isOpen={childModalParent !== null}
        parentItem={childModalParent}
        onClose={() => setChildModalParent(null)}
        onSubmit={async (parentId, child) => {
          if (onAddChild) {
            await onAddChild(parentId, child);
          }
        }}
        onNotify={onNotify}
      />

      {/* Confirm Delete Child Modal */}
      <ConfirmModal
        isOpen={deletingChild !== null}
        title="ยืนยันการลบรายการย่อย"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการย่อยนี้? ยอดรวมรายเดือนของรายการหลักจะถูกคำนวณใหม่"
        itemTitle={deletingChild ? deletingChild.title : undefined}
        confirmText="ยืนยันการลบ"
        cancelText="ยกเลิก"
        variant="danger"
        onConfirm={handleConfirmDeleteChild}
        onCancel={() => setDeletingChild(null)}
      />

      {/* Confirm Delete Item Modal */}
      <ConfirmModal
        isOpen={deletingItem !== null}
        title="ยืนยันการลบรายการ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ออกจากระบบ? เมื่อลบแล้วข้อมูลยอดหนี้และสถิติรายเดือนจะถูกคำนวณใหม่"
        itemTitle={deletingItem ? `${deletingItem.title} (${formatCurrency(deletingItem.monthly)})` : undefined}
        confirmText="ยืนยันการลบ"
        cancelText="ยกเลิก"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />

      {/* Confirm Reset Month Modal */}
      <ConfirmModal
        isOpen={isResetMonthOpen}
        title="ยืนยันการเริ่มรอบบิลใหม่"
        message="คุณต้องการเริ่มรอบบิลใหม่สำหรับเดือนถัดไปใช่หรือไม่? ระบบจะรีเซ็ตเฉพาะสถานะเช็กลิสต์กลับเป็น 'รอชำระ' เพื่อให้เริ่มติ๊กใหม่ในเดือนนี้ โดยความคืบหน้าการผ่อนและยอดหนี้คงเหลือที่ผ่อนชำระไปแล้วจะไม่ได้รับผลกระทบ"
        confirmText="เริ่มรอบใหม่"
        cancelText="ยกเลิก"
        variant="warning"
        onConfirm={handleConfirmResetMonth}
        onCancel={() => setIsResetMonthOpen(false)}
      />
    </div>
  );
};
