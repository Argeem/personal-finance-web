import { LandInstallment } from '../../core/domain/LandInstallment';

export interface ILandRepository {
  getAll(): Promise<LandInstallment[]>;
  saveAll(installments: LandInstallment[]): Promise<void>;
  updatePeriod(period: number, updates: Partial<LandInstallment>): Promise<LandInstallment>;
  resetToDefault(): Promise<LandInstallment[]>;
}
