import { ExpenseItem } from '../domain/ExpenseItem';
import { DebtOverviewMetrics, DebtSnowballItem, StudentLoan } from '../domain/DebtSummary';

export class CalculateSnowballPlanUseCase {
  execute(items: ExpenseItem[], studentLoan: StudentLoan): DebtOverviewMetrics {
    const debtItems = items.filter(i => i.type === 'debt');
    const consumerDebt = debtItems.reduce((acc, i) => acc + (Number(i.remaining) || 0), 0);
    const totalAllDebt = consumerDebt + studentLoan.remaining;

    // Convert items into snowball candidates
    const candidates: Array<{
      id: string;
      title: string;
      category: string;
      remaining: number;
      monthly: number;
      principal: number;
      installment: string;
      isStudentLoan: boolean;
    }> = debtItems.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      remaining: d.remaining,
      monthly: d.monthly,
      principal: d.principal,
      installment: d.installment,
      isStudentLoan: false,
    }));

    // Add Student loan
    candidates.push({
      id: 'student_loan',
      title: studentLoan.title,
      category: studentLoan.channel,
      remaining: studentLoan.remaining,
      monthly: 0,
      principal: studentLoan.principal,
      installment: 'สัญญาระยะยาว',
      isStudentLoan: true,
    });

    // Snowball method: sort ascending by remaining debt balance (smallest first)
    candidates.sort((a, b) => a.remaining - b.remaining);

    const snowballList: DebtSnowballItem[] = candidates.map((item, index) => {
      const progressPercent = item.principal > 0
        ? Math.round(((item.principal - item.remaining) / item.principal) * 100)
        : 0;

      return {
        ...item,
        rank: index + 1,
        progressPercent,
      };
    });

    return {
      totalAllDebt,
      studentLoanDebt: studentLoan.remaining,
      consumerDebt,
      consumerAccountsCount: debtItems.length,
      snowballList,
    };
  }
}
