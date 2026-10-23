import { IFinanceRepository } from '../../../ports/out/IFinanceRepository';
import { ExpenseItem, ExpenseChildItem } from '../../../core/domain/ExpenseItem';
import { INITIAL_EXPENSE_ITEMS } from '../../../config/initialData';

const STORAGE_KEY = 'FINTRACK_HEX_EXPENSES_V2';
const OLD_STORAGE_KEY = 'FINTRACK_HEX_EXPENSES_V1';

export class LocalStorageFinanceAdapter implements IFinanceRepository {
  async getAll(): Promise<ExpenseItem[]> {
    try {
      // 1. Try reading from V2 storage
      const v2Data = localStorage.getItem(STORAGE_KEY);
      if (v2Data) {
        const parsed = JSON.parse(v2Data) as ExpenseItem[];
        if (this.hasCreditCardParent(parsed)) {
          return parsed;
        }
        // If V2 exists but somehow missing credit card parent, migrate it
        const migrated = this.migrateCreditCard(parsed);
        await this.saveAll(migrated);
        return migrated;
      }

      // 2. Try migrating from V1 storage
      const v1Data = localStorage.getItem(OLD_STORAGE_KEY);
      if (v1Data) {
        const parsedV1 = JSON.parse(v1Data) as ExpenseItem[];
        const migrated = this.migrateCreditCard(parsedV1);
        await this.saveAll(migrated);
        return migrated;
      }
    } catch (e) {
      console.warn('Failed to parse expenses from LocalStorage:', e);
    }

    // 3. Fallback to INITIAL_EXPENSE_ITEMS from financeData.json
    const defaults = [...INITIAL_EXPENSE_ITEMS];
    await this.saveAll(defaults);
    return defaults;
  }

  private hasCreditCardParent(items: ExpenseItem[]): boolean {
    return items.some(
      i =>
        (i.id === 'item_cc_recurring' || i.title === 'บัตรเครดิต') &&
        Array.isArray(i.children) &&
        i.children.length > 0
    );
  }

  private migrateCreditCard(items: ExpenseItem[]): ExpenseItem[] {
    // If it already has item_cc_recurring with children, just remove old duplicate item_1 / item_2
    const existingCc = items.find(
      i => (i.id === 'item_cc_recurring' || i.title === 'บัตรเครดิต') && i.children && i.children.length > 0
    );
    if (existingCc) {
      return items.filter(i => i.id !== 'item_1' && i.id !== 'item_2');
    }

    // Find old insurance and HBO items if they exist
    const insItem = items.find(i => i.id === 'item_1' || i.title === 'ประกัน');
    const hboItem = items.find(i => i.id === 'item_2' || i.title === 'HBO');

    const children: ExpenseChildItem[] = [
      {
        id: 'child_ins_1',
        title: 'ประกัน',
        category: 'ประกันภัย/สุขภาพ',
        monthly: insItem?.monthly ?? 1880,
        paid: insItem?.paid ?? false,
      },
      {
        id: 'child_hbo_2',
        title: 'HBO',
        category: 'บันเทิง/สตรีมมิ่ง',
        monthly: hboItem?.monthly ?? 299,
        paid: hboItem?.paid ?? false,
      },
    ];

    const totalMonthly = children.reduce((s, c) => s + (Number(c.monthly) || 0), 0);
    const allPaid = children.every(c => c.paid);

    const ccParent: ExpenseItem = {
      id: 'item_cc_recurring',
      title: 'บัตรเครดิต',
      category: 'ตัดผ่านบัตรเครดิต',
      monthly: totalMonthly,
      principal: 0,
      remaining: 0,
      installment: 'รายเดือน',
      paid: allPaid,
      type: 'subscription',
      icon: 'CreditCard',
      children,
    };

    // Remove old standalone item_1, item_2, and standalone ประกัน / HBO
    const filtered = items.filter(
      i =>
        i.id !== 'item_1' &&
        i.id !== 'item_2' &&
        i.id !== 'item_cc_recurring' &&
        i.title !== 'ประกัน' &&
        i.title !== 'HBO'
    );

    return [ccParent, ...filtered];
  }

  async saveAll(items: ExpenseItem[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save expenses to LocalStorage:', e);
    }
  }

  async updateItem(id: string, updates: Partial<ExpenseItem>): Promise<ExpenseItem> {
    const items = await this.getAll();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Expense item with id ${id} not found`);
    }

    const updated = { ...items[index], ...updates };
    items[index] = updated;
    await this.saveAll(items);
    return updated;
  }

  async addItem(item: ExpenseItem): Promise<ExpenseItem> {
    const items = await this.getAll();
    items.push(item);
    await this.saveAll(items);
    return item;
  }

  async deleteItem(id: string): Promise<void> {
    const items = await this.getAll();
    const filtered = items.filter(i => i.id !== id);
    await this.saveAll(filtered);
  }

  async resetToDefault(): Promise<ExpenseItem[]> {
    const defaults = [...INITIAL_EXPENSE_ITEMS];
    await this.saveAll(defaults);
    return defaults;
  }
}
