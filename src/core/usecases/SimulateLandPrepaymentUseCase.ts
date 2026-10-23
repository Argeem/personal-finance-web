import { LandInstallment, LandSummaryMetrics, PrepaymentSimulationResult } from '../domain/LandInstallment';

export class SimulateLandPrepaymentUseCase {
  getSummaryMetrics(installments: LandInstallment[]): LandSummaryMetrics {
    const totalPeriods = installments.length;
    const paidItems = installments.filter(i => i.paid);
    const paidPeriodsCount = paidItems.length;
    const remainingPeriodsCount = totalPeriods - paidPeriodsCount;
    const totalPaidAmount = paidItems.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

    // Contract baseline is 72 * 10,000 = 720,000
    const contractEstimatedTotal = 720000;
    const remainingDebt = Math.max(0, contractEstimatedTotal - totalPaidAmount);
    const progressPercent = totalPeriods > 0 ? Number(((paidPeriodsCount / totalPeriods) * 100).toFixed(1)) : 0;
    const nextDueInstallment = installments.find(i => !i.paid) || null;

    return {
      totalPeriods,
      paidPeriodsCount,
      remainingPeriodsCount,
      totalPaidAmount,
      remainingDebt,
      contractEstimatedTotal,
      progressPercent,
      nextDueInstallment,
    };
  }

  simulate(installments: LandInstallment[], extraMonthlyPayment: number): PrepaymentSimulationResult {
    const normalMonthly = 10000;
    const totalMonthlyPayment = normalMonthly + extraMonthlyPayment;

    const paidItems = installments.filter(i => i.paid);
    const totalPaidAmount = paidItems.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const contractTotal = 720000;
    const remainingDebt = Math.max(0, contractTotal - totalPaidAmount);

    const normalMonthsRemaining = Math.ceil(remainingDebt / normalMonthly);
    const acceleratedMonthsRemaining = Math.ceil(remainingDebt / totalMonthlyPayment);
    const monthsSaved = Math.max(0, normalMonthsRemaining - acceleratedMonthsRemaining);

    let projectedFinishDescription = '';
    if (extraMonthlyPayment === 0) {
      projectedFinishDescription = `ผ่อนตามสัญญาปกติ ${normalMonthsRemaining} เดือน (สิ้นสุด พ.ค. 2575)`;
    } else {
      const yearsSaved = (monthsSaved / 12).toFixed(1);
      projectedFinishDescription = `ผ่อนเพียง ${acceleratedMonthsRemaining} เดือน ช่วยปลดหนี้เร็วขึ้นประมาณ ${monthsSaved} เดือน (~${yearsSaved} ปี)`;
    }

    return {
      extraMonthlyPayment,
      totalMonthlyPayment,
      remainingDebt,
      normalMonthsRemaining,
      acceleratedMonthsRemaining,
      monthsSaved,
      projectedFinishDescription,
    };
  }
}
