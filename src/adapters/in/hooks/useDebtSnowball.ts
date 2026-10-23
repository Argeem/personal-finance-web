import { useMemo } from 'react';
import { ExpenseItem } from '../../../core/domain/ExpenseItem';
import { DebtOverviewMetrics } from '../../../core/domain/DebtSummary';
import { INITIAL_STUDENT_LOAN } from '../../../config/initialData';
import { container } from '../../../config/container';

export function useDebtSnowball(items: ExpenseItem[]) {
  const studentLoan = INITIAL_STUDENT_LOAN;

  const debtOverview: DebtOverviewMetrics = useMemo(() => {
    return container.calculateSnowballPlanUseCase.execute(items, studentLoan);
  }, [items, studentLoan]);

  return {
    debtOverview,
    studentLoan,
  };
}
