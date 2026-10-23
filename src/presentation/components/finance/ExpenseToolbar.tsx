import React from 'react';
import { Search, Download } from 'lucide-react';
import { ExpenseItem } from '../../../core/domain/ExpenseItem';

interface ExpenseToolbarProps {
  filter: 'all' | 'pending' | 'paid' | 'subscription' | 'debt';
  onFilterChange: (f: 'all' | 'pending' | 'paid' | 'subscription' | 'debt') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  items: ExpenseItem[];
  onExportCsv: () => void;
}

export const ExpenseToolbar: React.FC<ExpenseToolbarProps> = ({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  items,
  onExportCsv,
}) => {
  const countAll = items.length;
  const countPending = items.filter(i => !i.paid).length;
  const countPaid = items.filter(i => i.paid).length;

  return (
    <div className="toolbar-wrap">
      <div className="filter-pills" role="tablist">
        <button
          type="button"
          className={`pill-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          ทั้งหมด ({countAll})
        </button>
        <button
          type="button"
          className={`pill-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => onFilterChange('pending')}
        >
          ⏳ รอชำระ ({countPending})
        </button>
        <button
          type="button"
          className={`pill-btn ${filter === 'paid' ? 'active' : ''}`}
          onClick={() => onFilterChange('paid')}
        >
          ✅ ชำระแล้ว ({countPaid})
        </button>
        <button
          type="button"
          className={`pill-btn ${filter === 'subscription' ? 'active' : ''}`}
          onClick={() => onFilterChange('subscription')}
        >
          Subscription รายเดือน
        </button>
        <button
          type="button"
          className={`pill-btn ${filter === 'debt' ? 'active' : ''}`}
          onClick={() => onFilterChange('debt')}
        >
          หนี้ผ่อนชำระ
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหารายการ, ช่องทาง..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onExportCsv}
          title="ดาวน์โหลดไฟล์ CSV"
        >
          <Download size={14} />
          CSV
        </button>
      </div>
    </div>
  );
};
