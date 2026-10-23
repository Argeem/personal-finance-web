import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExpenseItem, ExpenseChildItem, FinanceMetrics } from '../../../core/domain/ExpenseItem';
import { container } from '../../../config/container';

export function useFinanceDashboard() {
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'subscription' | 'debt'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load items on mount
  const loadItems = useCallback(async () => {
    setLoading(true);
    const data = await container.financeRepo.getAll();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Compute metrics using pure domain use case
  const metrics: FinanceMetrics = useMemo(() => {
    return container.calculateMetricsUseCase.execute(items);
  }, [items]);

  // Toggle paid (supports toggling parent or child)
  const togglePaid = async (id: string, childId?: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    let updated: ExpenseItem;

    if (childId && item.children) {
      // Toggle child item
      const updatedChildren = item.children.map(c =>
        c.id === childId ? { ...c, paid: !c.paid } : c
      );
      const allPaid = updatedChildren.every(c => c.paid);
      updated = await container.financeRepo.updateItem(id, {
        children: updatedChildren,
        paid: allPaid,
      });
    } else {
      // Toggle parent item
      const newPaidStatus = !item.paid;
      const updates: Partial<ExpenseItem> = { paid: newPaidStatus };
      if (item.children && item.children.length > 0) {
        updates.children = item.children.map(c => ({ ...c, paid: newPaidStatus }));
      }

      // If debt item, update remaining and installment progress
      if (item.principal > 0) {
        const monthly = Number(item.monthly) || 0;
        const currentRemaining = Number(item.remaining ?? item.principal);
        const installmentMatch = item.installment ? item.installment.match(/^(\d+)\s*(\/|\s)\s*(\d+)$/) : null;

        if (newPaidStatus) {
          // Checked: Progress increases, remaining debt decreases
          const newRemaining = Math.max(0, Math.round((currentRemaining - monthly) * 100) / 100);
          updates.remaining = newRemaining;

          if (installmentMatch) {
            const curr = parseInt(installmentMatch[1], 10);
            const total = parseInt(installmentMatch[3], 10);
            const newCurr = Math.min(total, curr + 1);
            updates.installment = `${newCurr} / ${total}`;
          }
        } else {
          // Unchecked: Progress decreases, remaining debt restored
          const newRemaining = Math.min(item.principal, Math.round((currentRemaining + monthly) * 100) / 100);
          updates.remaining = newRemaining;

          if (installmentMatch) {
            const curr = parseInt(installmentMatch[1], 10);
            const total = parseInt(installmentMatch[3], 10);
            const newCurr = Math.max(0, curr - 1);
            updates.installment = `${newCurr} / ${total}`;
          }
        }
      }

      updated = await container.financeRepo.updateItem(id, updates);
    }

    setItems(prev => prev.map(i => (i.id === id ? updated : i)));

    // Optional background sync to Google Sheets
    const webhookUrl = localStorage.getItem('FINTRACK_SHEET_URL');
    if (webhookUrl) {
      container.sheetsSync.syncUpdate(webhookUrl, {
        action: 'toggle_paid',
        timestamp: new Date().toISOString(),
        data: updated,
      });
    }
  };

  // Add child item to a parent (e.g. adding to บัตรเครดิต)
  const addChildItem = async (parentId: string, childData: Omit<ExpenseChildItem, 'id'>) => {
    const item = items.find(i => i.id === parentId);
    if (!item) return;

    const newChild: ExpenseChildItem = {
      ...childData,
      id: `child_${Date.now()}`,
    };

    const existingChildren = item.children || [];
    const updatedChildren = [...existingChildren, newChild];
    const newMonthly = updatedChildren.reduce((sum, c) => sum + (Number(c.monthly) || 0), 0);
    const allPaid = updatedChildren.every(c => c.paid);

    const updated = await container.financeRepo.updateItem(parentId, {
      children: updatedChildren,
      monthly: newMonthly,
      paid: allPaid,
    });

    setItems(prev => prev.map(i => (i.id === parentId ? updated : i)));
    return updated;
  };

  // Edit child item
  const editChildItem = async (parentId: string, childId: string, updates: Partial<ExpenseChildItem>) => {
    const item = items.find(i => i.id === parentId);
    if (!item || !item.children) return;

    const updatedChildren = item.children.map(c =>
      c.id === childId ? { ...c, ...updates } : c
    );
    const newMonthly = updatedChildren.reduce((sum, c) => sum + (Number(c.monthly) || 0), 0);
    const allPaid = updatedChildren.every(c => c.paid);

    const updated = await container.financeRepo.updateItem(parentId, {
      children: updatedChildren,
      monthly: newMonthly,
      paid: allPaid,
    });

    setItems(prev => prev.map(i => (i.id === parentId ? updated : i)));
    return updated;
  };

  // Delete child item
  const deleteChildItem = async (parentId: string, childId: string) => {
    const item = items.find(i => i.id === parentId);
    if (!item || !item.children) return;

    const updatedChildren = item.children.filter(c => c.id !== childId);
    const newMonthly = updatedChildren.reduce((sum, c) => sum + (Number(c.monthly) || 0), 0);
    const allPaid = updatedChildren.length > 0 ? updatedChildren.every(c => c.paid) : false;

    const updated = await container.financeRepo.updateItem(parentId, {
      children: updatedChildren,
      monthly: newMonthly,
      paid: allPaid,
    });

    setItems(prev => prev.map(i => (i.id === parentId ? updated : i)));
    return updated;
  };

  // Add Item
  const addItem = async (newItem: Omit<ExpenseItem, 'id'>) => {
    const item: ExpenseItem = {
      ...newItem,
      id: `item_${Date.now()}`,
    };
    const created = await container.financeRepo.addItem(item);
    setItems(prev => [...prev, created]);
    return created;
  };

  // Edit Item
  const editItem = async (id: string, updates: Partial<ExpenseItem>) => {
    const updated = await container.financeRepo.updateItem(id, updates);
    setItems(prev => prev.map(i => (i.id === id ? updated : i)));
    return updated;
  };

  // Delete Item
  const deleteItem = async (id: string) => {
    await container.financeRepo.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Reset monthly checks (start new month)
  const resetMonthlyChecks = async () => {
    const resetList = items.map(i => ({
      ...i,
      paid: false,
      children: i.children ? i.children.map(c => ({ ...c, paid: false })) : undefined,
    }));
    await container.financeRepo.saveAll(resetList);
    setItems(resetList);
  };

  // Reset to default Excel data
  const resetToDefault = async () => {
    const defaults = await container.financeRepo.resetToDefault();
    setItems(defaults);
  };

  // Filtered items (sorted so unpaid items come first)
  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      // Type/Status filter
      if (filter === 'pending' && item.paid) return false;
      if (filter === 'paid' && !item.paid) return false;
      if (filter === 'subscription' && item.type !== 'subscription') return false;
      if (filter === 'debt' && item.type !== 'debt') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = (item.category || '').toLowerCase().includes(q);
        const matchesChild = item.children?.some(c =>
          c.title.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesCategory && !matchesChild) return false;
      }

      return true;
    });

    // sort รายการที่ยังไม่ได้จ่ายขึ้นก่อน (unpaid first)
    return [...filtered].sort((a, b) => {
      if (a.paid === b.paid) return 0;
      return a.paid ? 1 : -1;
    });
  }, [items, filter, searchQuery]);

  // Set all items (e.g. from JSON import)
  const setAllItems = async (newItems: ExpenseItem[]) => {
    await container.financeRepo.saveAll(newItems);
    setItems(newItems);
  };

  return {
    items,
    filteredItems,
    metrics,
    loading,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    togglePaid,
    addChildItem,
    editChildItem,
    deleteChildItem,
    addItem,
    editItem,
    deleteItem,
    resetMonthlyChecks,
    resetToDefault,
    setAllItems,
  };
}
