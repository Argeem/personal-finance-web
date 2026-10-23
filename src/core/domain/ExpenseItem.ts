export type ExpenseType = 'subscription' | 'debt';

export interface ExpenseChildItem {
  id: string;
  title: string;
  category?: string;
  monthly: number;
  paid: boolean;
  note?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  monthly: number;
  principal: number;
  remaining: number;
  installment: string;
  paid: boolean;
  type: ExpenseType;
  icon?: string;
  children?: ExpenseChildItem[];
}

export interface FinanceMetrics {
  subTotal: number;
  subPaid: number;
  subPercent: number;

  debtTotal: number;
  debtPaid: number;
  debtPaidCount: number;
  debtAccountsCount: number;

  monthTotal: number;
  monthPaidTotal: number;
  totalCheckPercent: number;
  paidItemsCount: number;
  totalItemsCount: number;

  totalOutstandingDebt: number;
  totalPrincipalDebt: number;
}
