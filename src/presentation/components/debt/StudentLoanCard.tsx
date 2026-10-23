import React from 'react';
import { StudentLoan } from '../../../core/domain/DebtSummary';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface StudentLoanCardProps {
  studentLoan: StudentLoan;
}

export const StudentLoanCard: React.FC<StudentLoanCardProps> = ({ studentLoan }) => {
  const percentPaid = studentLoan.principal > 0
    ? (studentLoan.paid / studentLoan.principal) * 100
    : 0;

  return (
    <div className="debt-breakdown-card">
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>🎓 บัญชีหนี้ กยศ. (Student Loan)</span>
      </h3>

      <div
        style={{
          background: 'var(--bg-surface-elevated)',
          padding: '18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>วงเงินต้นตามสัญญา:</span>
          <strong style={{ fontSize: '14px' }}>{formatCurrency(studentLoan.principal)}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ชำระสะสมแล้ว:</span>
          <strong style={{ fontSize: '14px', color: 'var(--emerald-400)' }}>
            {formatCurrency(studentLoan.paid)} ({formatPercent(percentPaid)})
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>หนี้คงเหลือสุทธิ:</span>
          <strong style={{ fontSize: '18px', color: 'var(--rose-400)' }}>
            {formatCurrency(studentLoan.remaining)}
          </strong>
        </div>

        <div className="kpi-progress">
          <div
            className="kpi-progress-bar bg-emerald"
            style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
          />
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
        💡 <strong>คำแนะนำทางการเงิน:</strong> กยศ. มีอัตราดอกเบี้ยต่ำมาก (ประมาณ 1% ต่อปี)
        ดังนั้นควรจัดลำดับความสำคัญในการชำระหนี้บัตรเครดิตและหนี้ผ่อนสินค้าที่มีดอกเบี้ยสูงกว่าให้หมดก่อน แล้วจึงเร่งปิด กยศ.
      </div>
    </div>
  );
};
