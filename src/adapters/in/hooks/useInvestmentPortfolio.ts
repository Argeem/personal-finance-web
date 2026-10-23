import { useState, useEffect, useCallback, useMemo } from 'react';
import { InvestmentItem, PortfolioMetrics } from '../../../core/domain/Investment';
import { container } from '../../../config/container';

export function useInvestmentPortfolio() {
  const [items, setItems] = useState<InvestmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load items on mount
  const loadItems = useCallback(async () => {
    setLoading(true);
    const data = await container.investmentRepo.getAll();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Compute portfolio metrics
  const metrics: PortfolioMetrics = useMemo(() => {
    return container.calculatePortfolioMetricsUseCase.execute(items);
  }, [items]);

  // Deposit (ฝากเงิน / เพิ่มทุน)
  const deposit = async (id: string, amount: number, note?: string) => {
    if (amount <= 0) return;
    const updated = await container.investmentRepo.recordTransaction(id, 'deposit', amount, note);
    setItems(prev => prev.map(item => (item.id === id ? updated : item)));
    return updated;
  };

  // Withdraw (ถอนเงิน / ลดทุน)
  const withdraw = async (id: string, amount: number, note?: string) => {
    if (amount <= 0) return;
    const updated = await container.investmentRepo.recordTransaction(id, 'withdraw', amount, note);
    setItems(prev => prev.map(item => (item.id === id ? updated : item)));
    return updated;
  };

  // Update current market value (แก้ไขมูลค่าปัจจุบัน เพื่อคำนวณกำไร/ขาดทุน %)
  const updateCurrentValue = async (id: string, newValue: number) => {
    if (newValue < 0) return;
    const updated = await container.investmentRepo.updateCurrentValue(id, newValue);
    setItems(prev => prev.map(item => (item.id === id ? updated : item)));
    return updated;
  };

  // Reset to default
  const resetToDefault = async () => {
    const defaults = await container.investmentRepo.resetToDefault();
    setItems(defaults);
    return defaults;
  };

  // Set all items (e.g. from JSON import)
  const setAllInvestments = async (newList: InvestmentItem[]) => {
    await container.investmentRepo.saveAll(newList);
    setItems(newList);
  };

  return {
    items,
    metrics,
    loading,
    deposit,
    withdraw,
    updateCurrentValue,
    resetToDefault,
    setAllInvestments,
  };
}
