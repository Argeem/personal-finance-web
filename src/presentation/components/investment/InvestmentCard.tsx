import React from 'react';
import {
  PiggyBank,
  TrendingUp,
  CandlestickChart,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Edit3,
  ShieldCheck,
} from 'lucide-react';
import { InvestmentItem, calculateItemPnL } from '../../../core/domain/Investment';

interface InvestmentCardProps {
  item: InvestmentItem;
  onOpenDeposit: (item: InvestmentItem) => void;
  onOpenWithdraw: (item: InvestmentItem) => void;
  onOpenUpdateValue: (item: InvestmentItem) => void;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({
  item,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenUpdateValue,
}) => {
  const isSavings = item.type === 'savings';
  const pnl = calculateItemPnL(item);

  // Pick appropriate icon
  const renderIcon = () => {
    if (item.icon === 'PiggyBank' || isSavings) {
      return <PiggyBank size={24} strokeWidth={2.2} />;
    }
    if (item.icon === 'CandlestickChart' || item.name.includes('trade')) {
      return <CandlestickChart size={24} strokeWidth={2.2} />;
    }
    return <TrendingUp size={24} strokeWidth={2.2} />;
  };

  const getThemeColor = () => {
    if (isSavings) return { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', text: 'var(--sky-400)' };
    if (item.name.includes('trade')) return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', text: 'var(--amber-400)' };
    return { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)', text: 'var(--purple-400)' };
  };

  const theme = getThemeColor();

  return (
    <div
      className="data-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${theme.border}`,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.bg,
                color: theme.text,
              }}
            >
              {renderIcon()}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{item.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {item.description || (isSavings ? 'เงินออมเผื่อฉุกเฉิน' : 'พอร์ตการลงทุน')}
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: theme.bg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
            }}
          >
            {isSavings ? '🛡️ เงินออม' : '📈 สินทรัพย์ลงทุน'}
          </span>
        </div>

        {/* Current Value Display */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isSavings ? 'ยอดเงินเก็บคงเหลือ' : 'มูลค่าตลาดปัจจุบัน (Market Value)'}
            </span>
            {!isSavings && (
              <button
                type="button"
                onClick={() => onOpenUpdateValue(item)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--sky-400)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
                title="กดเพื่อใส่ตัวเลขมูลค่าปัจจุบัน"
              >
                <Edit3 size={12} /> ใส่ตัวเลขปัจจุบัน
              </button>
            )}
          </div>

          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {item.currentValue.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>฿</span>
          </div>

          {/* If Investment: Show Cost Basis & Profit/Loss */}
          {!isSavings && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                marginTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '12px',
              }}
            >
              <div style={{ color: 'var(--text-muted)' }}>
                ต้นทุน: <strong style={{ color: 'var(--text-secondary)' }}>{item.costBasis.toLocaleString()} ฿</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
                  color: pnl.isProfit ? 'var(--emerald-400)' : pnl.isLoss ? 'var(--rose-400)' : 'var(--text-muted)',
                }}
              >
                {pnl.isProfit ? <ArrowUpRight size={15} /> : pnl.isLoss ? <ArrowDownRight size={15} /> : null}
                <span>
                  {pnl.pnlAmount > 0 ? `+${pnl.pnlAmount.toLocaleString()}` : pnl.pnlAmount.toLocaleString()} ฿
                </span>
                <span>({pnl.pnlPercent > 0 ? `+${pnl.pnlPercent.toFixed(2)}%` : `${pnl.pnlPercent.toFixed(2)}%`})</span>
              </div>
            </div>
          )}

          {/* If Savings: Safety badge */}
          {isSavings && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--emerald-400)', marginTop: '6px' }}>
              <ShieldCheck size={14} />
              <span>เงินต้นปลอดภัย ไม่มีความเสี่ยงราคาผันผวน</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className="btn btn-emerald btn-sm"
          style={{ flex: 1, padding: '9px 12px', fontSize: '13px', fontWeight: 600 }}
          onClick={() => onOpenDeposit(item)}
        >
          <Plus size={15} />
          {isSavings ? 'ฝากเงิน' : 'ฝาก / ซื้อเพิ่ม'}
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, padding: '9px 12px', fontSize: '13px', fontWeight: 600 }}
          onClick={() => onOpenWithdraw(item)}
          disabled={item.currentValue <= 0}
        >
          <Minus size={15} />
          {isSavings ? 'ถอนเงิน' : 'ถอน / ขาย'}
        </button>
      </div>
    </div>
  );
};
