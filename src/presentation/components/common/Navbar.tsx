import React from 'react';
import { BarChart3, Home, CreditCard, Sun, Moon, PiggyBank, Settings, Save } from 'lucide-react';
import { Theme } from '../../../adapters/in/hooks/useTheme';

export type ActiveTab = 'finance' | 'invest' | 'land' | 'debt';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  theme: Theme;
  onToggleTheme: () => void;
  syncStatus: string;
  onOpenSettings: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  syncStatus,
  onOpenSettings,
  onSave,
  isSaving,
}) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <button
          type="button"
          className="brand-wrapper"
          onClick={() => onTabChange('finance')}
          aria-label="FinTrack Pro Home"
        >
          <div className="brand-icon">
            <BarChart3 size={20} strokeWidth={2.4} />
          </div>
          <div className="brand-info">
            <h1>FinTrack Pro</h1>
            <p>Personal Finance & Debt Architecture</p>
          </div>
        </button>

        {/* Desktop Nav - 4 Tabs Exactly */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-btn ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => onTabChange('finance')}
          >
            <BarChart3 size={17} />
            หน้าแรก
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === 'invest' ? 'active' : ''}`}
            onClick={() => onTabChange('invest')}
          >
            <PiggyBank size={17} />
            เงินเก็บ
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === 'land' ? 'active' : ''}`}
            onClick={() => onTabChange('land')}
          >
            <Home size={17} />
            ผ่อนที่ดิน
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === 'debt' ? 'active' : ''}`}
            onClick={() => onTabChange('debt')}
          >
            <CreditCard size={17} />
            หนี้สินรวม
          </button>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {onSave && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onSave}
              disabled={isSaving}
              title="บันทึกข้อมูลลง src/data/financeData.json ทันที"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={14} className={isSaving ? 'animate-spin' : ''} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenSettings}
            title="ตั้งค่าระบบ บันทึกไฟล์ Deploy และจัดการข้อมูล"
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Settings size={15} />
            <span>ตั้งค่า</span>
          </button>

          <button
            type="button"
            className="sync-badge-btn"
            onClick={onOpenSettings}
            title="สถานะเชื่อมต่อ (คลิกเพื่อตั้งค่า)"
          >
            <span className="sync-dot" />
            <span>{syncStatus}</span>
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};

