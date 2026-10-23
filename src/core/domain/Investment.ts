export type AssetType = 'savings' | 'investment';

export interface InvestmentTransaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  note?: string;
}

export interface InvestmentItem {
  id: string;
  name: string;
  type: AssetType;
  costBasis: number;       // ต้นทุนสะสม (บาท)
  currentValue: number;    // มูลค่าตลาดปัจจุบัน (บาท)
  description?: string;
  icon?: string;
  updatedAt?: string;
  transactions?: InvestmentTransaction[];
}

export interface PortfolioMetrics {
  totalCost: number;
  totalCurrentValue: number;
  totalPnLAmount: number;
  totalPnLPercent: number;
  totalSavings: number;
  totalInvestments: number;
}

export function calculateItemPnL(item: InvestmentItem): {
  pnlAmount: number;
  pnlPercent: number;
  isProfit: boolean;
  isLoss: boolean;
} {
  if (item.type === 'savings') {
    return { pnlAmount: 0, pnlPercent: 0, isProfit: false, isLoss: false };
  }
  const diff = item.currentValue - item.costBasis;
  const percent = item.costBasis > 0 ? (diff / item.costBasis) * 100 : 0;
  return {
    pnlAmount: diff,
    pnlPercent: percent,
    isProfit: diff > 0,
    isLoss: diff < 0,
  };
}
