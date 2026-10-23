import { ILandRepository } from '../../../ports/out/ILandRepository';
import { LandInstallment } from '../../../core/domain/LandInstallment';
import { createInitialLandInstallments } from '../../../config/initialData';

const STORAGE_KEY = 'FINTRACK_HEX_LAND_V1';

export class LocalStorageLandAdapter implements ILandRepository {
  async getAll(): Promise<LandInstallment[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as LandInstallment[];
      }
    } catch (e) {
      console.warn('Failed to parse land installments from LocalStorage:', e);
    }
    return createInitialLandInstallments();
  }

  async saveAll(installments: LandInstallment[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(installments));
    } catch (e) {
      console.error('Failed to save land installments to LocalStorage:', e);
    }
  }

  async updatePeriod(period: number, updates: Partial<LandInstallment>): Promise<LandInstallment> {
    const list = await this.getAll();
    const index = list.findIndex(i => i.period === period);
    if (index === -1) {
      throw new Error(`Land installment period ${period} not found`);
    }

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    await this.saveAll(list);
    return updated;
  }

  async resetToDefault(): Promise<LandInstallment[]> {
    const defaults = createInitialLandInstallments();
    await this.saveAll(defaults);
    return defaults;
  }
}
