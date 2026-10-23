import { InvestmentItem } from '../../core/domain/Investment';

export interface IInvestmentRepository {
  getAll(): Promise<InvestmentItem[]>;
  saveAll(items: InvestmentItem[]): Promise<void>;
  updateItem(id: string, updates: Partial<InvestmentItem>): Promise<InvestmentItem>;
  recordTransaction(
    id: string,
    type: 'deposit' | 'withdraw',
    amount: number,
    note?: string
  ): Promise<InvestmentItem>;
  updateCurrentValue(id: string, newValue: number): Promise<InvestmentItem>;
  resetToDefault(): Promise<InvestmentItem[]>;
}
