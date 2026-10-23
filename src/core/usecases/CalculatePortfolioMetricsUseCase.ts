import { InvestmentItem, PortfolioMetrics } from '../domain/Investment';

export class CalculatePortfolioMetricsUseCase {
  execute(items: InvestmentItem[]): PortfolioMetrics {
    let totalCost = 0;
    let totalCurrentValue = 0;
    let totalSavings = 0;
    let totalInvestments = 0;
    let investmentCost = 0;
    let investmentCurrentValue = 0;

    for (const item of items) {
      totalCost += item.costBasis;
      totalCurrentValue += item.currentValue;

      if (item.type === 'savings') {
        totalSavings += item.currentValue;
      } else {
        totalInvestments += item.currentValue;
        investmentCost += item.costBasis;
        investmentCurrentValue += item.currentValue;
      }
    }

    const totalPnLAmount = investmentCurrentValue - investmentCost;
    const totalPnLPercent = investmentCost > 0 ? (totalPnLAmount / investmentCost) * 100 : 0;

    return {
      totalCost,
      totalCurrentValue,
      totalPnLAmount,
      totalPnLPercent,
      totalSavings,
      totalInvestments,
    };
  }
}
