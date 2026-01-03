import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";

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
  const completedLabel = type === 'receivables' ? 'Total Recebido' : 'Total Pago';
  const pendingLabel = type === 'receivables' ? 'A Receber' : 'A Pagar';
  
  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="flex flex-col gap-1 text-sm sm:text-base">
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            Resumo do Período:
          </span>
          <span className="text-xs sm:text-sm font-normal text-muted-foreground">
            {format(startDate, "dd/MM/yyyy", { locale: ptBR })} - {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex-shrink-0">
              <TrendingUp className="h-3 w-3 text-yellow-600" />
            </div>
            <span className="text-xs text-muted-foreground">{pendingLabel}</span>
            <span className="text-sm font-semibold text-yellow-600 ml-auto">{formatCurrency(totalPending)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/20 flex-shrink-0">
              <TrendingUp className="h-3 w-3 text-green-600" />
            </div>
            <span className="text-xs text-muted-foreground">{completedLabel}</span>
            <span className="text-sm font-semibold text-green-600 ml-auto">{formatCurrency(totalCompleted)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/20 flex-shrink-0">
              <TrendingDown className="h-3 w-3 text-red-600" />
            </div>
            <span className="text-xs text-muted-foreground">Em Atraso</span>
            <span className="text-sm font-semibold text-red-600 ml-auto">{formatCurrency(totalOverdue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};