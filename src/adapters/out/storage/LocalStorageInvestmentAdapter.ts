import { IInvestmentRepository } from '../../../ports/out/IInvestmentRepository';
import { InvestmentItem } from '../../../core/domain/Investment';
import { INITIAL_INVESTMENTS } from '../../../config/initialData';

const STORAGE_KEY = 'FINTRACK_HEX_INVESTMENTS_V1';

export class LocalStorageInvestmentAdapter implements IInvestmentRepository {
  async getAll(): Promise<InvestmentItem[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as InvestmentItem[];
      }
    } catch (e) {
      console.warn('Failed to parse investments from LocalStorage:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_INVESTMENTS));
  }

  async saveAll(items: InvestmentItem[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save investments to LocalStorage:', e);
    }
  }

  async updateItem(id: string, updates: Partial<InvestmentItem>): Promise<InvestmentItem> {
    const list = await this.getAll();
    const index = list.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Investment item with id ${id} not found`);
    }

    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    await this.saveAll(list);
    return updated;
  }

  async recordTransaction(
    id: string,
    type: 'deposit' | 'withdraw',
    amount: number,
    note?: string
  ): Promise<InvestmentItem> {
    const list = await this.getAll();
    const index = list.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Investment item with id ${id} not found`);
    }

    const item = list[index];
    const prevCost = item.costBasis;
    const prevCurrent = item.currentValue;

    let newCost = prevCost;
    let newCurrent = prevCurrent;

    if (type === 'deposit') {
      newCost = prevCost + amount;
      newCurrent = prevCurrent + amount;
    } else {
      newCost = Math.max(0, prevCost - amount);
      newCurrent = Math.max(0, prevCurrent - amount);
    }

    const tx = {
      id: `tx_${Date.now()}`,
      type,
      amount,
      date: new Date().toISOString(),
      note: note || '',
    };

    const transactions = item.transactions ? [tx, ...item.transactions] : [tx];

    const updated: InvestmentItem = {
      ...item,
      costBasis: newCost,
      currentValue: newCurrent,
      transactions,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    await this.saveAll(list);
    return updated;
  }

  async updateCurrentValue(id: string, newValue: number): Promise<InvestmentItem> {
    const list = await this.getAll();
    const index = list.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Investment item with id ${id} not found`);
    }

    const updated: InvestmentItem = {
      ...list[index],
      currentValue: newValue,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    await this.saveAll(list);
    return updated;
  }

  async resetToDefault(): Promise<InvestmentItem[]> {
    const defaults = JSON.parse(JSON.stringify(INITIAL_INVESTMENTS));
    await this.saveAll(defaults);
    return defaults;
  }
}
