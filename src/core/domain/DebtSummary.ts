export interface StudentLoan {
  title: string;
  principal: number;
  paid: number;
  remaining: number;
  channel: string;
}

export interface DebtSnowballItem {
  id: string;
  rank: number;
  title: string;
  category: string;
  remaining: number;
  monthly: number;
  principal: number;
  installment: string;
  isStudentLoan: boolean;
  progressPercent: number;
}

export interface DebtOverviewMetrics {
  totalAllDebt: number;
  studentLoanDebt: number;
  consumerDebt: number;
  consumerAccountsCount: number;
  snowballList: DebtSnowballItem[];
}
