import React from 'react';
import { BarChart3, Home, CreditCard, PiggyBank } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      <button
        type="button"
        className={`m-nav-item ${activeTab === 'finance' ? 'active' : ''}`}
        onClick={() => onTabChange('finance')}
      >
        <BarChart3 size={20} />
        <span>หน้าแรก</span>
      </button>

      <button
        type="button"
        className={`m-nav-item ${activeTab === 'invest' ? 'active' : ''}`}
        onClick={() => onTabChange('invest')}
      >
        <PiggyBank size={20} />
        <span>เงินเก็บ</span>
      </button>

      <button
        type="button"
        className={`m-nav-item ${activeTab === 'land' ? 'active' : ''}`}
        onClick={() => onTabChange('land')}
      >
        <Home size={20} />
        <span>ผ่อนที่ดิน</span>
      </button>

      <button
        type="button"
        className={`m-nav-item ${activeTab === 'debt' ? 'active' : ''}`}
        onClick={() => onTabChange('debt')}
      >
        <CreditCard size={20} />
        <span>หนี้สินรวม</span>
      </button>
    </nav>
  );
};

