import { ExpenseItem } from '../../core/domain/ExpenseItem';

export interface IFinanceRepository {
  getAll(): Promise<ExpenseItem[]>;
  saveAll(items: ExpenseItem[]): Promise<void>;
  updateItem(id: string, updates: Partial<ExpenseItem>): Promise<ExpenseItem>;
  addItem(item: ExpenseItem): Promise<ExpenseItem>;
  deleteItem(id: string): Promise<void>;
  resetToDefault(): Promise<ExpenseItem[]>;
}
