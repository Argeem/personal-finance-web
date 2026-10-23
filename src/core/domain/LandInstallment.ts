export interface LandInstallment {
  period: number;         // งวดที่ 1 - 72
  month: string;          // เช่น มิถุนายน, กรกฎาคม
  year: number;           // เช่น 2569 - 2575
  amount: number;         // ยอดที่จ่ายจริง (0 ถ้ายังไม่จ่าย)
  plannedAmount: number;  // ยอดเป้าหมายต่องวด (ปกติ 10,000)
  paid: boolean;          // จ่ายแล้วหรือยัง
  note?: string;          // หมายเหตุ (เช่น *รอบ 21 พฤษภา - 20 มิถุนา)
}

export interface LandSummaryMetrics {
  totalPeriods: number;
  paidPeriodsCount: number;
  remainingPeriodsCount: number;
  totalPaidAmount: number;
  remainingDebt: number;
  contractEstimatedTotal: number;
  progressPercent: number;
  nextDueInstallment: LandInstallment | null;
}

export interface PrepaymentSimulationResult {
  extraMonthlyPayment: number;
  totalMonthlyPayment: number;
  remainingDebt: number;
  normalMonthsRemaining: number;
  acceleratedMonthsRemaining: number;
  monthsSaved: number;
  projectedFinishDescription: string;
}
