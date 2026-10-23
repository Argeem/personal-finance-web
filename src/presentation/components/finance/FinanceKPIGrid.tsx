import React from 'react';
import { Smartphone, CreditCard, DollarSign, Landmark } from 'lucide-react';
import { FinanceMetrics } from '../../../core/domain/ExpenseItem';
import { KPICard } from '../common/KPICard';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface FinanceKPIGridProps {
  metrics: FinanceMetrics;
}

export const FinanceKPIGrid: React.FC<FinanceKPIGridProps> = ({ metrics }) => {
  return (
    <div className="kpi-grid">
      <KPICard
        title="📋 รายจ่าย Subscription เดือนนี้"
        value={formatCurrency(metrics.subTotal)}
        subtextLeft={`จ่ายแล้ว ${formatCurrency(metrics.subPaid)}`}
        subtextRight={formatPercent(metrics.subPercent)}
        progressPercent={metrics.subPercent}
        progressBarColor="indigo"
        cardColor="blue"
        icon={<Smartphone size={18} />}
      />

      <KPICard
        title="💳 ค่างวดหนี้สินเดือนนี้"
        value={formatCurrency(metrics.debtTotal)}
        subtextLeft={`จ่ายแล้ว ${formatCurrency(metrics.debtPaid)}`}
        subtextRight={`${metrics.debtPaidCount}/${metrics.debtAccountsCount} บัญชี`}
        progressPercent={metrics.debtTotal > 0 ? (metrics.debtPaid / metrics.debtTotal) * 100 : 0}
        progressBarColor="amber"
        cardColor="purple"
        icon={<CreditCard size={18} />}
      />

      <KPICard
        title="💰 รวมภาระต้องจ่ายเดือนนี้"
        value={formatCurrency(metrics.monthTotal)}
        subtextLeft={`เช็กลิสต์แล้ว ${metrics.paidItemsCount}/${metrics.totalItemsCount} รายการ`}
        subtextRight={`จ่ายแล้ว ${formatCurrency(metrics.monthPaidTotal)}`}
        progressPercent={metrics.totalCheckPercent}
        progressBarColor="emerald"
        cardColor="amber"
        icon={<DollarSign size={18} />}
      />

      <KPICard
        title="🏦 หนี้สินคงค้างผ่อนทั้งหมด"
        value={formatCurrency(metrics.totalOutstandingDebt)}
        subtextLeft={`ภาระหนี้ผ่อนชำระ ${metrics.debtAccountsCount} บัญชี`}
        subtextRight="(ไม่รวม กยศ.)"
        progressPercent={65}
        progressBarColor="rose"
        cardColor="rose"
        icon={<Landmark size={18} />}
      />
    </div>
  );
};
