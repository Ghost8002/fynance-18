import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { StatusDistributionBar } from './StatusDistributionBar';

interface PeriodSummaryProps {
  startDate: Date;
  endDate: Date;
  totalPending: number;
  totalCompleted: number;
  totalOverdue: number;
  type: 'receivables' | 'debts';
}

const formatCurrency = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const PeriodSummary = ({ 
  startDate, 
  endDate, 
  totalPending, 
  totalCompleted, 
  totalOverdue,
  type
}: PeriodSummaryProps) => {
  const isReceivables = type === 'receivables';
  const completedLabel = isReceivables ? 'Recebido' : 'Pago';
  const pendingLabel = isReceivables ? 'A Receber' : 'A Pagar';
  const total = totalPending + totalCompleted + totalOverdue;
  const completionPct = total > 0 ? (totalCompleted / total) * 100 : 0;

  const gradientClass = isReceivables
    ? 'from-blue-500/5 to-blue-500/10 border-blue-500/20'
    : 'from-orange-500/5 to-orange-500/10 border-orange-500/20';

  const titleIcon = isReceivables
    ? <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    : <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />;

  const titleLabel = isReceivables ? 'A Receber' : 'A Pagar';

  return (
    <Card className={`bg-gradient-to-r ${gradientClass} overflow-hidden`}>
      <CardHeader className="pb-2 px-3 sm:px-5 pt-3 sm:pt-4">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
          <span className="flex items-center gap-2">
            {titleIcon}
            {titleLabel}
          </span>
          <span className="text-[10px] sm:text-xs font-normal text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {format(startDate, "dd/MM", { locale: ptBR })} - {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-5 pb-3 sm:pb-4 space-y-3">
        {/* Values */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-yellow-500/10 flex-shrink-0">
                <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{pendingLabel}</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-yellow-600 dark:text-yellow-400 pl-6">
              {formatCurrency(totalPending)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-green-500/10 flex-shrink-0">
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{completedLabel}</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400 pl-6">
              {formatCurrency(totalCompleted)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-red-500/10 flex-shrink-0">
                <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Atraso</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 pl-6">
              {formatCurrency(totalOverdue)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
            <span>{completionPct.toFixed(0)}% concluído</span>
            <span className="font-medium">{formatCurrency(total)}</span>
          </div>
          <StatusDistributionBar 
            pending={totalPending} 
            completed={totalCompleted} 
            overdue={totalOverdue} 
            type={type} 
          />
        </div>
      </CardContent>
    </Card>
  );
};
