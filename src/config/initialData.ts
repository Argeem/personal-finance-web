import rawData from '../data/financeData.json';
import { ExpenseItem } from '../core/domain/ExpenseItem';
import { LandInstallment } from '../core/domain/LandInstallment';
import { StudentLoan } from '../core/domain/DebtSummary';
import { InvestmentItem } from '../core/domain/Investment';

export interface FinanceDataSchema {
  version: string;
  updatedAt: string;
  items: ExpenseItem[];
  landInstallments: LandInstallment[];
  investments?: InvestmentItem[];
  debtOverview: {
    student_loan: StudentLoan;
    fixed_expenses?: number;
    total_debt?: number;
  };
}

export const INITIAL_DATA = rawData as unknown as FinanceDataSchema;

export const INITIAL_EXPENSE_ITEMS: ExpenseItem[] = INITIAL_DATA.items;

export function createInitialLandInstallments(): LandInstallment[] {
  return [...INITIAL_DATA.landInstallments];
}

export const INITIAL_INVESTMENTS: InvestmentItem[] = INITIAL_DATA.investments || [
  {
    id: "inv_1",
    name: "เงินเก็บ",
    type: "savings",
    costBasis: 1500,
    currentValue: 1500,
    description: "เงินออมสำรองเผื่อฉุกเฉิน / เงินฝากออมทรัพย์",
    icon: "PiggyBank"
  },
  {
    id: "inv_2",
    name: "DCA ETF",
    type: "investment",
    costBasis: 5000,
    currentValue: 5000,
    description: "กองทุนรวมดัชนี / DCA รายเดือน",
    icon: "TrendingUp"
  },
  {
    id: "inv_3",
    name: "หุ้น trade",
    type: "investment",
    costBasis: 13000,
    currentValue: 13000,
    description: "พอร์ตเทรดหุ้นระยะสั้น / เก็งกำไร",
    icon: "CandlestickChart"
  }
];

export const INITIAL_STUDENT_LOAN: StudentLoan = INITIAL_DATA.debtOverview.student_loan;


