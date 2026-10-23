import React from 'react';
import { DollarSign, GraduationCap, ShoppingBag } from 'lucide-react';
import { DebtOverviewMetrics, StudentLoan } from '../../core/domain/DebtSummary';
import { KPICard } from '../components/common/KPICard';
import { DebtSnowballList } from '../components/debt/DebtSnowballList';
import { StudentLoanCard } from '../components/debt/StudentLoanCard';
import { formatCurrency } from '../utils/formatters';

interface DebtOverviewViewProps {
  debtOverview: DebtOverviewMetrics;
  studentLoan: StudentLoan;
}

export const DebtOverviewView: React.FC<DebtOverviewViewProps> = ({
  debtOverview,
  studentLoan,
}) => {
  return (
    <div>
      <div className="section-header">
        <div className="section-title-wrap">
          <h2>
            <span>💳 สรุปภาระหนี้สินคงค้างทั้งหมด & แผนปลดหนี้</span>
          </h2>
          <p>
            รวบรวมภาระหนี้สินทุกสัญญารวมถึงหนี้ กยศ. พร้อมลำดับการปลดหนี้แบบ Snowball Strategy
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <KPICard
          title="หนี้สินคงค้างสุทธิรวมทั้งหมด"
          value={formatCurrency(debtOverview.totalAllDebt)}
          subtextLeft="รวม กยศ. + หนี้ผ่อน 5 รายการ"
          cardColor="rose"
          progressBarColor="rose"
          progressPercent={100}
          icon={<DollarSign size={18} />}
        />

        <KPICard
          title="หนี้ กยศ. (เพื่อการศึกษา)"
          value={formatCurrency(debtOverview.studentLoanDebt)}
          subtextLeft={`เงินต้น ${formatCurrency(studentLoan.principal)}`}
          subtextRight={`จ่ายแล้ว ${formatCurrency(studentLoan.paid)}`}
          cardColor="blue"
          progressBarColor="emerald"
          progressPercent={(studentLoan.paid / studentLoan.principal) * 100}
          icon={<GraduationCap size={18} />}
        />

        <KPICard
          title="หนี้ผ่อนชำระสินค้า / บัตรเครดิต"
          value={formatCurrency(debtOverview.consumerDebt)}
          subtextLeft={`${debtOverview.consumerAccountsCount} บัญชี (TV, กล้อง, โทรศัพท์, บัตร)`}
          cardColor="purple"
          progressBarColor="amber"
          progressPercent={40}
          icon={<ShoppingBag size={18} />}
        />
      </div>

      {/* Snowball List & Student loan detailed card */}
      <div className="debt-overview-grid">
        <DebtSnowballList snowballList={debtOverview.snowballList} />
        <StudentLoanCard studentLoan={studentLoan} />
      </div>
    </div>
  );
};
