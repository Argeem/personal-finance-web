import React from 'react';
import { PrepaymentSimulationResult } from '../../../core/domain/LandInstallment';
import { formatCurrency } from '../../utils/formatters';

interface PrepaymentSimulatorProps {
  simulation: PrepaymentSimulationResult;
  extraPayment: number;
  onExtraPaymentChange: (amount: number) => void;
}

export const PrepaymentSimulator: React.FC<PrepaymentSimulatorProps> = ({
  simulation,
  extraPayment,
  onExtraPaymentChange,
}) => {
  return (
    <div className="calculator-card">
      <div className="section-title-wrap">
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
          ⚡ แผนจำลองการโปะที่ดิน (Prepayment Simulator)
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          ถ้าคุณเพิ่มเงินผ่อนต่องวด จะช่วยให้ปลดภาระที่ดินนี้ได้เร็วขึ้นกี่เดือน?
        </p>
      </div>

      <div className="calc-grid">
        <div className="slider-group">
          <label>
            <span>เงินผ่อนปกติต่องวด:</span>
            <strong>฿10,000 / เดือน</strong>
          </label>
          <label>
            <span>เพิ่มเงินโปะพิเศษต่อเดือน:</span>
            <strong style={{ color: 'var(--emerald-400)' }}>
              +{formatCurrency(extraPayment)} / เดือน
            </strong>
          </label>
          <input
            type="range"
            min={0}
            max={20000}
            step={500}
            value={extraPayment}
            onChange={e => onExtraPaymentChange(Number(e.target.value))}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            เลื่อนสไลเดอร์เพื่อดูผลลัพธ์ทันที
          </span>
        </div>

        <div className="calc-result-box">
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            ผลประโยชน์ที่จะได้รับ:
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--emerald-400)' }}>
            {simulation.monthsSaved > 0
              ? `หมดหนี้เร็วขึ้นประมาณ ${simulation.monthsSaved} เดือน! 🚀`
              : 'ผ่อนตามระยะเวลาสัญญาปกติ'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {simulation.projectedFinishDescription}
          </div>
        </div>
      </div>
    </div>
  );
};
