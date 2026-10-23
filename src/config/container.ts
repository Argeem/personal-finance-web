import { LocalStorageFinanceAdapter } from '../adapters/out/storage/LocalStorageFinanceAdapter';
import { LocalStorageLandAdapter } from '../adapters/out/storage/LocalStorageLandAdapter';
import { LocalStorageInvestmentAdapter } from '../adapters/out/storage/LocalStorageInvestmentAdapter';
import { GoogleSheetsWebhookAdapter } from '../adapters/out/sheets/GoogleSheetsWebhookAdapter';
import { JsonDataSyncService, jsonDataSyncService } from '../adapters/out/storage/JsonDataSyncService';
import { CalculateMetricsUseCase } from '../core/usecases/CalculateMetricsUseCase';
import { CalculateSnowballPlanUseCase } from '../core/usecases/CalculateSnowballPlanUseCase';
import { SimulateLandPrepaymentUseCase } from '../core/usecases/SimulateLandPrepaymentUseCase';
import { CalculatePortfolioMetricsUseCase } from '../core/usecases/CalculatePortfolioMetricsUseCase';

export interface AppContainer {
  financeRepo: LocalStorageFinanceAdapter;
  landRepo: LocalStorageLandAdapter;
  investmentRepo: LocalStorageInvestmentAdapter;
  sheetsSync: GoogleSheetsWebhookAdapter;
  jsonSync: JsonDataSyncService;
  calculateMetricsUseCase: CalculateMetricsUseCase;
  calculateSnowballPlanUseCase: CalculateSnowballPlanUseCase;
  simulateLandPrepaymentUseCase: SimulateLandPrepaymentUseCase;
  calculatePortfolioMetricsUseCase: CalculatePortfolioMetricsUseCase;
}

// Single instance factory for the Hexagonal Architecture
export const container: AppContainer = {
  financeRepo: new LocalStorageFinanceAdapter(),
  landRepo: new LocalStorageLandAdapter(),
  investmentRepo: new LocalStorageInvestmentAdapter(),
  sheetsSync: new GoogleSheetsWebhookAdapter(),
  jsonSync: jsonDataSyncService,
  calculateMetricsUseCase: new CalculateMetricsUseCase(),
  calculateSnowballPlanUseCase: new CalculateSnowballPlanUseCase(),
  simulateLandPrepaymentUseCase: new SimulateLandPrepaymentUseCase(),
  calculatePortfolioMetricsUseCase: new CalculatePortfolioMetricsUseCase(),
};


