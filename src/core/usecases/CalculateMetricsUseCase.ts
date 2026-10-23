import { ExpenseItem, FinanceMetrics } from '../domain/ExpenseItem';

export class CalculateMetricsUseCase {
  execute(items: ExpenseItem[]): FinanceMetrics {
    const getItemMonthly = (i: ExpenseItem): number => {
      if (i.children && i.children.length > 0) {
        return i.children.reduce((sum, c) => sum + (Number(c.monthly) || 0), 0);
      }
      return Number(i.monthly) || 0;
    };

    const getItemPaidMonthly = (i: ExpenseItem): number => {
      if (i.children && i.children.length > 0) {
        return i.children.filter(c => c.paid).reduce((sum, c) => sum + (Number(c.monthly) || 0), 0);
      }
      return i.paid ? (Number(i.monthly) || 0) : 0;
    };

    const subItems = items.filter(i => i.type === 'subscription');
    const subTotal = subItems.reduce((acc, i) => acc + getItemMonthly(i), 0);
    const subPaid = subItems.reduce((acc, i) => acc + getItemPaidMonthly(i), 0);
    const subPercent = subTotal > 0 ? (subPaid / subTotal) * 100 : 0;

    const debtItems = items.filter(i => i.type === 'debt');
    const debtTotal = debtItems.reduce((acc, i) => acc + getItemMonthly(i), 0);
    const debtPaid = debtItems.reduce((acc, i) => acc + getItemPaidMonthly(i), 0);
    const debtPaidCount = debtItems.filter(i => i.paid).length;

    const monthTotal = subTotal + debtTotal;
    const monthPaidTotal = subPaid + debtPaid;
    const totalItemsCount = items.length;
    const paidItemsCount = items.filter(i => i.paid).length;
    const totalCheckPercent = totalItemsCount > 0 ? (paidItemsCount / totalItemsCount) * 100 : 0;

    const totalOutstandingDebt = debtItems.reduce((acc, i) => acc + (Number(i.remaining) || 0), 0);
    const totalPrincipalDebt = debtItems.reduce((acc, i) => acc + (Number(i.principal) || 0), 0);

    return {
      subTotal,
      subPaid,
      subPercent,
      debtTotal,
      debtPaid,
      debtPaidCount,
      debtAccountsCount: debtItems.length,
      monthTotal,
      monthPaidTotal,
      totalCheckPercent,
      paidItemsCount,
      totalItemsCount,
      totalOutstandingDebt,
      totalPrincipalDebt,
    };
  }
}
