import React, { useState } from 'react';
import { LandInstallment, LandSummaryMetrics, PrepaymentSimulationResult } from '../../core/domain/LandInstallment';
import { LandHeroCard } from '../components/land/LandHeroCard';
import { InstallmentGrid } from '../components/land/InstallmentGrid';
import { PrepaymentSimulator } from '../components/land/PrepaymentSimulator';
import { LandPayModal } from '../components/land/LandPayModal';

interface LandTrackerViewProps {
  allInstallments: LandInstallment[];
  filteredInstallments: LandInstallment[];
  metrics: LandSummaryMetrics;
  simulation: PrepaymentSimulationResult;
  activeYear: string;
  onYearChange: (year: string) => void;
  extraPayment: number;
  onExtraPaymentChange: (amount: number) => void;
  onRecordPayment: (period: number, amount: number, paid: boolean, note?: string) => Promise<LandInstallment>;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export const LandTrackerView: React.FC<LandTrackerViewProps> = ({
  allInstallments,
  filteredInstallments,
  metrics,
  simulation,
  activeYear,
  onYearChange,
  extraPayment,
  onExtraPaymentChange,
  onRecordPayment,
  onNotify,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (period: number) => {
    setSelectedPeriod(period);
    setIsModalOpen(true);
  };

  const selectedInstallment = filteredInstallments.find(i => i.period === selectedPeriod) ||
    metrics.nextDueInstallment ||
    filteredInstallments[0] ||
    null;

  const handleConfirmPayment = async (period: number, amount: number, paid: boolean, note?: string) => {
    await onRecordPayment(period, amount, paid, note);
    onNotify(`บันทึกงวดที่ ${period} สำเร็จ`, 'success');
  };

  return (
    <div>
      {/* Hero Overview & Next Due & GitHub Contribution Heatmap */}
      <LandHeroCard
        metrics={metrics}
        allInstallments={allInstallments}
        onSelectPeriod={handleOpenModal}
        onPayNext={() => {
          if (metrics.nextDueInstallment) {
            handleOpenModal(metrics.nextDueInstallment.period);
          }
        }}
        onEditNextAmount={() => {
          if (metrics.nextDueInstallment) {
            handleOpenModal(metrics.nextDueInstallment.period);
          }
        }}
      />

      {/* 72 Installment Cards Grid */}
      <InstallmentGrid
        installments={filteredInstallments}
        allInstallments={allInstallments}
        nextDuePeriod={metrics.nextDueInstallment?.period}
        activeYear={activeYear}
        onYearChange={onYearChange}
        onSelectPeriod={handleOpenModal}
      />

      {/* Prepayment Calculator */}
      <PrepaymentSimulator
        simulation={simulation}
        extraPayment={extraPayment}
        onExtraPaymentChange={onExtraPaymentChange}
      />

      {/* Payment Modal */}
      <LandPayModal
        isOpen={isModalOpen}
        installment={selectedInstallment}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
};
