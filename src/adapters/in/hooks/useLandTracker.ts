import { useState, useEffect, useCallback, useMemo } from 'react';
import { LandInstallment, LandSummaryMetrics, PrepaymentSimulationResult } from '../../../core/domain/LandInstallment';
import { container } from '../../../config/container';

export function useLandTracker() {
  const [installments, setInstallments] = useState<LandInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<string>('all');
  const [extraPayment, setExtraPayment] = useState<number>(2000);

  // Load installments on mount
  const loadInstallments = useCallback(async () => {
    setLoading(true);
    const data = await container.landRepo.getAll();
    setInstallments(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInstallments();
  }, [loadInstallments]);

  // Summary Metrics
  const metrics: LandSummaryMetrics = useMemo(() => {
    return container.simulateLandPrepaymentUseCase.getSummaryMetrics(installments);
  }, [installments]);

  // Prepayment Simulation Result
  const simulation: PrepaymentSimulationResult = useMemo(() => {
    return container.simulateLandPrepaymentUseCase.simulate(installments, extraPayment);
  }, [installments, extraPayment]);

  // Record / Edit Payment
  const recordPayment = async (period: number, amount: number, paid: boolean, note?: string) => {
    const finalAmount = amount > 0 ? amount : 10000;
    const updated = await container.landRepo.updatePeriod(period, {
      amount: paid ? finalAmount : 0,
      plannedAmount: finalAmount,
      paid,
      note: note || '',
    });

    setInstallments(prev => prev.map(i => (i.period === period ? updated : i)));

    // Optional background sync to Google Sheets
    const webhookUrl = localStorage.getItem('FINTRACK_SHEET_URL');
    if (webhookUrl) {
      container.sheetsSync.syncUpdate(webhookUrl, {
        action: 'land_payment',
        timestamp: new Date().toISOString(),
        data: updated,
      });
    }

    return updated;
  };

  // Reset to default
  const resetToDefault = async () => {
    const defaults = await container.landRepo.resetToDefault();
    setInstallments(defaults);
  };

  // Filtered by year
  const filteredInstallments = useMemo(() => {
    if (activeYear === 'all') return installments;
    return installments.filter(i => String(i.year) === activeYear);
  }, [installments, activeYear]);

  // Set all installments (e.g. from JSON import)
  const setAllInstallments = async (newList: LandInstallment[]) => {
    await container.landRepo.saveAll(newList);
    setInstallments(newList);
  };

  return {
    installments,
    filteredInstallments,
    metrics,
    simulation,
    loading,
    activeYear,
    setActiveYear,
    extraPayment,
    setExtraPayment,
    recordPayment,
    resetToDefault,
    setAllInstallments,
  };
}
