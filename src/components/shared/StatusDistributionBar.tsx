import React from 'react';

interface StatusDistributionBarProps {
  pending: number;
  completed: number;
  overdue: number;
  type: 'receivables' | 'debts';
}

const formatCurrency = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const StatusDistributionBar = ({ pending, completed, overdue, type }: StatusDistributionBarProps) => {
  const total = pending + completed + overdue;
  
  if (total === 0) return null;

  const pendingPct = (pending / total) * 100;
  const completedPct = (completed / total) * 100;
  const overduePct = (overdue / total) * 100;

  const completedLabel = type === 'receivables' ? 'Recebido' : 'Pago';

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-muted">
        {completedPct > 0 && (
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${completedPct}%` }}
          />
        )}
        {pendingPct > 0 && (
          <div
            className="h-full bg-yellow-500 transition-all duration-500"
            style={{ width: `${pendingPct}%` }}
          />
        )}
        {overduePct > 0 && (
          <div
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${overduePct}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {completedPct > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>{completedLabel} {completedPct.toFixed(0)}%</span>
          </div>
        )}
        {pendingPct > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>Pendente {pendingPct.toFixed(0)}%</span>
          </div>
        )}
        {overduePct > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Em Atraso {overduePct.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
