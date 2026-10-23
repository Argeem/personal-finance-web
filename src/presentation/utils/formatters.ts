export function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '฿0';
  return '฿' + Number(num).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatPercent(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return '0%';
  return Math.round(num) + '%';
}
