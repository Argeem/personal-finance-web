import React, { useState, useEffect, useRef } from 'react';
import { Navbar, ActiveTab } from './presentation/components/common/Navbar';
import { MobileBottomNav } from './presentation/components/common/MobileBottomNav';
import { SettingsModal } from './presentation/components/common/SettingsModal';
import { FinanceDashboardView } from './presentation/views/FinanceDashboardView';
import { LandTrackerView } from './presentation/views/LandTrackerView';
import { DebtOverviewView } from './presentation/views/DebtOverviewView';
import { SavingsInvestmentView } from './presentation/views/SavingsInvestmentView';
import { useFinanceDashboard } from './adapters/in/hooks/useFinanceDashboard';
import { useLandTracker } from './adapters/in/hooks/useLandTracker';
import { useDebtSnowball } from './adapters/in/hooks/useDebtSnowball';
import { useInvestmentPortfolio } from './adapters/in/hooks/useInvestmentPortfolio';
import { useTheme } from './adapters/in/hooks/useTheme';
import { InvestmentItem } from './core/domain/Investment';
import { container } from './config/container';
import './presentation/styles/theme.css';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'info';
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('finance');
  const [syncStatus, setSyncStatus] = useState<string>('พร้อมใช้งาน');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const isFirstSyncRef = useRef<boolean>(true);

  // Inbound Hooks (Adapters)
  const { theme, toggleTheme } = useTheme();

  const {
    items,
    filteredItems,
    metrics,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    togglePaid,
    addItem,
    editItem,
    deleteItem,
    addChildItem,
    deleteChildItem,
    resetMonthlyChecks,
    resetToDefault: resetFinanceDefault,
    setAllItems,
  } = useFinanceDashboard();

  const {
    installments,
    filteredInstallments,
    metrics: landMetrics,
    simulation,
    activeYear,
    setActiveYear,
    extraPayment,
    setExtraPayment,
    recordPayment,
    resetToDefault: resetLandDefault,
    setAllInstallments,
  } = useLandTracker();

  const {
    items: investments,
    metrics: investmentMetrics,
    deposit: depositInvestment,
    withdraw: withdrawInvestment,
    updateCurrentValue: updateInvestmentValue,
    resetToDefault: resetInvestmentDefault,
    setAllInvestments,
  } = useInvestmentPortfolio();

  const { debtOverview, studentLoan } = useDebtSnowball(items);

  // Toast notification helper
  const addToast = (text: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Import JSON data
  const handleImportData = async (
    newItems: typeof items,
    newInstallments: typeof installments,
    newInvestments?: InvestmentItem[]
  ) => {
    await setAllItems(newItems);
    await setAllInstallments(newInstallments);
    if (newInvestments && newInvestments.length > 0) {
      await setAllInvestments(newInvestments);
    }
  };

  // 1. Initial Load: Fetch latest data directly from src/data/financeData.json via dev server
  useEffect(() => {
    let active = true;
    async function initData() {
      try {
        const serverData = await container.jsonSync.fetchServerData();
        if (active && serverData) {
          if (Array.isArray(serverData.items) && serverData.items.length > 0) {
            await setAllItems(serverData.items);
          }
          if (Array.isArray(serverData.landInstallments) && serverData.landInstallments.length > 0) {
            await setAllInstallments(serverData.landInstallments);
          }
          if (Array.isArray(serverData.investments) && serverData.investments.length > 0) {
            await setAllInvestments(serverData.investments);
          }
          setSyncStatus('ซิงค์กับไฟล์สำเร็จ');
        }
      } catch (err) {
        console.warn('Initial server sync skipped:', err);
      } finally {
        if (active) {
          setIsInitialized(true);
        }
      }
    }
    initData();
    return () => {
      active = false;
    };
  }, []);

  // 2. Real-time Auto-Save: Whenever items, installments, or investments change, auto-save to disk
  useEffect(() => {
    if (!isInitialized) return;
    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false;
      return;
    }

    const payload = container.jsonSync.createFullPayload(items, installments, studentLoan, investments);
    setIsSaving(true);
    container.jsonSync.debouncedAutoSave(payload, (status) => {
      if (status === 'saving') {
        setIsSaving(true);
        setSyncStatus('กำลังบันทึกลงไฟล์...');
      } else if (status === 'saved') {
        setIsSaving(false);
        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setSyncStatus(`บันทึกแล้ว (${timeStr})`);
      } else if (status === 'error') {
        setIsSaving(false);
        setSyncStatus('บันทึกในเครื่องแล้ว');
      } else {
        setIsSaving(false);
        setSyncStatus('พร้อมใช้งาน');
      }
    });
  }, [items, installments, investments, studentLoan, isInitialized]);

  // 3. Manual Save handler for explicit Save button
  const handleManualSave = async () => {
    setIsSaving(true);
    setSyncStatus('กำลังบันทึกลงไฟล์...');
    try {
      const payload = container.jsonSync.createFullPayload(items, installments, studentLoan, investments);
      const res = await container.jsonSync.saveToProjectFile(payload, true);
      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (res.isLocalDev && res.success) {
        setSyncStatus(`บันทึกแล้ว (${timeStr})`);
        addToast('บันทึกข้อมูลลง src/data/financeData.json สำเร็จแล้ว', 'success');
      } else {
        setSyncStatus(`ดาวน์โหลดแล้ว (${timeStr})`);
        addToast(res.message, 'success');
      }
    } catch (err: any) {
      addToast(`บันทึกล้มเหลว: ${err.message}`, 'info');
      setSyncStatus('บันทึกล้มเหลว');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={tab => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        syncStatus={syncStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSave={handleManualSave}
        isSaving={isSaving}
      />

      {/* Main Feature Views - 4 Tabs Exactly */}
      <main className="main-wrapper">
        {activeTab === 'finance' && (
          <FinanceDashboardView
            items={items}
            filteredItems={filteredItems}
            metrics={metrics}
            filter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onTogglePaid={togglePaid}
            onAddItem={addItem}
            onEditItem={editItem}
            onDeleteItem={deleteItem}
            onAddChild={addChildItem}
            onDeleteChild={deleteChildItem}
            onResetMonthlyChecks={resetMonthlyChecks}
            onNotify={addToast}
          />
        )}

        {activeTab === 'invest' && (
          <SavingsInvestmentView
            items={investments}
            metrics={investmentMetrics}
            onDeposit={depositInvestment}
            onWithdraw={withdrawInvestment}
            onUpdateCurrentValue={updateInvestmentValue}
            onNotify={addToast}
          />
        )}

        {activeTab === 'land' && (
          <LandTrackerView
            allInstallments={installments}
            filteredInstallments={filteredInstallments}
            metrics={landMetrics}
            simulation={simulation}
            activeYear={activeYear}
            onYearChange={setActiveYear}
            extraPayment={extraPayment}
            onExtraPaymentChange={setExtraPayment}
            onRecordPayment={recordPayment}
            onNotify={addToast}
          />
        )}

        {activeTab === 'debt' && (
          <DebtOverviewView
            debtOverview={debtOverview}
            studentLoan={studentLoan}
          />
        )}
      </main>

      {/* Settings & Data Management Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        items={items}
        installments={installments}
        investments={investments}
        studentLoan={studentLoan}
        onResetFinance={resetFinanceDefault}
        onResetLand={resetLandDefault}
        onResetInvestments={resetInvestmentDefault}
        onImportData={handleImportData}
        onNotify={addToast}
        onUpdateSyncStatus={setSyncStatus}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={tab => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="toast-item"
            style={{
              borderLeft: toast.type === 'success' ? '4px solid var(--emerald-500)' : '4px solid var(--indigo-500)',
            }}
          >
            <span>{toast.type === 'success' ? '✅' : 'ℹ️'}</span>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
