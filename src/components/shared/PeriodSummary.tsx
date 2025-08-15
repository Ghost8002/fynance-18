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
    <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="h-5 w-5" />
          Resumo do Período: {format(startDate, "dd/MM/yyyy", { locale: ptBR })} - {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{pendingLabel}</p>
              <p className="text-lg font-semibold text-yellow-600">{formatCurrency(totalPending)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{completedLabel}</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalCompleted)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em Atraso</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(totalOverdue)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};