import React from 'react';
import { DebtSnowballItem } from '../../../core/domain/DebtSummary';
import { formatCurrency } from '../../utils/formatters';

interface DebtSnowballListProps {
  snowballList: DebtSnowballItem[];
}

export const DebtSnowballList: React.FC<DebtSnowballListProps> = ({ snowballList }) => {
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
        <span>🎯 ลำดับการปลดหนี้แนะนำ (Snowball Method)</span>
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
        หลักการ Snowball: เน้นเร่งปิดยอดหนี้ก้อนเล็กที่สุดก่อน เพื่อเพิ่มกระแสเงินสดกลับเข้ามาในแต่ละเดือน
      </p>

      <div>
        {snowballList.map(debt => (
          <div key={debt.id} className="snowball-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="snowball-rank">{debt.rank}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                  {debt.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {debt.category} • ค่างวด {formatCurrency(debt.monthly)}
                  {debt.progressPercent > 0 && ` • ผ่อนแล้ว ${debt.progressPercent}%`}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: debt.isStudentLoan ? 'var(--indigo-400)' : 'var(--amber-400)',
                }}
              >
                {formatCurrency(debt.remaining)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {debt.remaining <= 0 ? '🎉 ปลดหนี้แล้ว' : 'ยอดหนี้คงค้าง'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
