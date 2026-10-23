import React, { useState } from 'react';
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { InvestmentItem, PortfolioMetrics } from '../../core/domain/Investment';
import { KPICard } from '../components/common/KPICard';
import { InvestmentCard } from '../components/investment/InvestmentCard';
import { DepositWithdrawModal } from '../components/investment/DepositWithdrawModal';
import { UpdateValueModal } from '../components/investment/UpdateValueModal';

interface SavingsInvestmentViewProps {
  items: InvestmentItem[];
  metrics: PortfolioMetrics;
  onDeposit: (id: string, amount: number, note?: string) => Promise<any>;
  onWithdraw: (id: string, amount: number, note?: string) => Promise<any>;
  onUpdateCurrentValue: (id: string, newValue: number) => Promise<any>;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export const SavingsInvestmentView: React.FC<SavingsInvestmentViewProps> = ({
  items,
  metrics,
  onDeposit,
  onWithdraw,
  onUpdateCurrentValue,
  onNotify,
}) => {
  const [modalItem, setModalItem] = useState<InvestmentItem | null>(null);
  const [modalMode, setModalMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [isDepositWithdrawOpen, setIsDepositWithdrawOpen] = useState(false);
  const [isUpdateValueOpen, setIsUpdateValueOpen] = useState(false);

  const handleOpenDeposit = (item: InvestmentItem) => {
    setModalItem(item);
    setModalMode('deposit');
    setIsDepositWithdrawOpen(true);
  };

  const handleOpenWithdraw = (item: InvestmentItem) => {
    setModalItem(item);
    setModalMode('withdraw');
    setIsDepositWithdrawOpen(true);
  };

  const handleOpenUpdateValue = (item: InvestmentItem) => {
    setModalItem(item);
    setIsUpdateValueOpen(true);
  };

  const isTotalProfit = metrics.totalPnLAmount > 0;
  const isTotalLoss = metrics.totalPnLAmount < 0;

  // Calculate allocation percentages
  const totalVal = metrics.totalCurrentValue || 1;
  const savingsPctNum = (metrics.totalSavings / totalVal) * 100;
  const investPctNum = (metrics.totalInvestments / totalVal) * 100;
  const savingsPct = savingsPctNum.toFixed(1);
  const investPct = investPctNum.toFixed(1);

  return (
    <div>
      {/* View Header */}
      <div className="section-header">
        <div className="section-title-wrap">
          <h2>
            <span>💰 พอร์ตเงินเก็บ & การลงทุน</span>
          </h2>
          <p>
            ติดตามและบริหารเงินเก็บสำรอง, กองทุน DCA ETF และพอร์ตเทรดหุ้น พร้อมคำนวณผลตอบแทน กำไร/ขาดทุน %
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          title="สินทรัพย์สุทธิรวม"
          value={`${metrics.totalCurrentValue.toLocaleString()} ฿`}
          subtextLeft="เงินเก็บ + พอร์ตลงทุน"
          subtextRight="ทั้งหมด"
          cardColor="blue"
          icon={<Wallet size={20} />}
          progressPercent={100}
          progressBarColor="indigo"
        />

        <KPICard
          title="เงินเก็บสำรอง"
          value={`${metrics.totalSavings.toLocaleString()} ฿`}
          subtextLeft={`สัดส่วน ${savingsPct}%`}
          subtextRight="เงินต้นปลอดภัย"
          cardColor="blue"
          icon={<PiggyBank size={20} />}
          progressPercent={savingsPctNum}
          progressBarColor="emerald"
        />

        <KPICard
          title="มูลค่าพอร์ตลงทุน"
          value={`${metrics.totalInvestments.toLocaleString()} ฿`}
          subtextLeft={`ต้นทุน ${(metrics.totalCost - metrics.totalSavings).toLocaleString()} ฿`}
          subtextRight={`สัดส่วน ${investPct}%`}
          cardColor="purple"
          icon={<TrendingUp size={20} />}
          progressPercent={investPctNum}
          progressBarColor="amber"
        />

        <div
          className="kpi-card"
          style={{
            border: isTotalProfit
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : isTotalLoss
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid var(--border-subtle)',
          }}
        >
          <div className="kpi-header">
            <span className="kpi-title">กำไร / ขาดทุนรวม (P&L)</span>
            <div
              className={`kpi-icon ${isTotalProfit ? 'text-emerald' : isTotalLoss ? 'text-rose' : 'text-slate'}`}
            >
              <Percent size={22} />
            </div>
          </div>
          <div
            className="kpi-value"
            style={{
              color: isTotalProfit
                ? 'var(--emerald-400)'
                : isTotalLoss
                ? 'var(--rose-400)'
                : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isTotalProfit ? <ArrowUpRight size={26} /> : isTotalLoss ? <ArrowDownRight size={26} /> : null}
            <span>
              {metrics.totalPnLAmount > 0
                ? `+${metrics.totalPnLAmount.toLocaleString()}`
                : metrics.totalPnLAmount.toLocaleString()}{' '}
              ฿
            </span>
          </div>
          <div
            className="kpi-subtitle"
            style={{
              fontWeight: 700,
              color: isTotalProfit
                ? 'var(--emerald-400)'
                : isTotalLoss
                ? 'var(--rose-400)'
                : 'var(--text-muted)',
            }}
          >
            {metrics.totalPnLPercent > 0
              ? `ผลตอบแทน +${metrics.totalPnLPercent.toFixed(2)}%`
              : `ผลตอบแทน ${metrics.totalPnLPercent.toFixed(2)}%`}
          </div>
        </div>
      </div>

      {/* Asset Allocation Bar */}
      <div className="data-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            📊 สัดส่วนสินทรัพย์ในพอร์ต (Asset Allocation)
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            เงินเก็บ {savingsPct}% | การลงทุน {investPct}%
          </span>
        </div>

        {/* Multi-segment bar */}
        <div
          style={{
            height: '10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface-elevated)',
            overflow: 'hidden',
            display: 'flex',
            marginBottom: '12px',
          }}
        >
          {items.map(item => {
            const pct = metrics.totalCurrentValue > 0 ? (item.currentValue / metrics.totalCurrentValue) * 100 : 0;
            const bg =
              item.type === 'savings'
                ? 'var(--sky-400)'
                : item.name.includes('trade')
                ? 'var(--amber-400)'
                : 'var(--purple-400)';
            return (
              <div
                key={item.id}
                style={{
                  width: `${pct}%`,
                  background: bg,
                  transition: 'width 0.3s ease',
                }}
                title={`${item.name}: ${item.currentValue.toLocaleString()} ฿ (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
          {items.map(item => {
            const pct = metrics.totalCurrentValue > 0 ? (item.currentValue / metrics.totalCurrentValue) * 100 : 0;
            const dotColor =
              item.type === 'savings'
                ? 'var(--sky-400)'
                : item.name.includes('trade')
                ? 'var(--amber-400)'
                : 'var(--purple-400)';
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.name}:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  {item.currentValue.toLocaleString()} ฿ ({pct.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of the 3 Assets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {items.map(item => (
          <InvestmentCard
            key={item.id}
            item={item}
            onOpenDeposit={handleOpenDeposit}
            onOpenWithdraw={handleOpenWithdraw}
            onOpenUpdateValue={handleOpenUpdateValue}
          />
        ))}
      </div>

      {/* Deposit & Withdraw Modal */}
      <DepositWithdrawModal
        isOpen={isDepositWithdrawOpen}
        item={modalItem}
        mode={modalMode}
        onClose={() => setIsDepositWithdrawOpen(false)}
        onSubmit={async (id, amount, note) => {
          if (modalMode === 'deposit') {
            await onDeposit(id, amount, note);
          } else {
            await onWithdraw(id, amount, note);
          }
        }}
        onNotify={onNotify}
      />

      {/* Update Current Value Modal */}
      <UpdateValueModal
        isOpen={isUpdateValueOpen}
        item={modalItem}
        onClose={() => setIsUpdateValueOpen(false)}
        onSubmit={async (id, newValue) => {
          await onUpdateCurrentValue(id, newValue);
        }}
        onNotify={onNotify}
      />
    </div>
  );
};
