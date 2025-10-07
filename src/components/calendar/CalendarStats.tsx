
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

interface CalendarStatsProps {
  events: CalendarEvent[];
  selectedMonth: Date;
}

const CalendarStats = ({ events, selectedMonth }: CalendarStatsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Filtrar eventos do mês selecionado
  const monthEvents = events.filter(event => 
    event.date.getMonth() === selectedMonth.getMonth() &&
    event.date.getFullYear() === selectedMonth.getFullYear()
  );

  // Calcular estatísticas
  const totalReceivables = monthEvents
    .filter(event => event.type === 'receivable')
    .reduce((sum, event) => sum + event.amount, 0);

  const receivedAmount = monthEvents
    .filter(event => event.type === 'receivable' && event.status === 'received')
    .reduce((sum, event) => sum + event.amount, 0);

  const totalDebts = monthEvents
    .filter(event => event.type === 'debt')
    .reduce((sum, event) => sum + event.amount, 0);

  const paidDebts = monthEvents
    .filter(event => event.type === 'debt' && event.status === 'paid')
    .reduce((sum, event) => sum + event.amount, 0);

  const overdueCount = monthEvents.filter(event => event.status === 'overdue').length;
  const pendingReceivables = monthEvents.filter(event => 
    event.type === 'receivable' && event.status === 'pending'
  ).length;
  const pendingDebts = monthEvents.filter(event => 
    event.type === 'debt' && event.status === 'pending'
  ).length;

  const receivableProgress = totalReceivables > 0 ? (receivedAmount / totalReceivables) * 100 : 0;
  const debtProgress = totalDebts > 0 ? (paidDebts / totalDebts) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progresso de Recebimentos */}
      {totalReceivables > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Progresso - A Receber
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Recebido</span>
              <span className="font-medium">
                {formatCurrency(receivedAmount)} / {formatCurrency(totalReceivables)}
              </span>
            </div>
            <Progress value={receivableProgress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {receivableProgress.toFixed(1)}% concluído
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progresso de Pagamentos */}
      {totalDebts > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              Progresso - Dívidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Pago</span>
              <span className="font-medium">
                {formatCurrency(paidDebts)} / {formatCurrency(totalDebts)}
              </span>
            </div>
            <Progress value={debtProgress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {debtProgress.toFixed(1)}% concluído
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas e Pendências */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            Pendências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {overdueCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-300">Vencidos</span>
              </div>
              <span className="font-bold text-red-700 dark:text-red-300">{overdueCount}</span>
            </div>
          )}
          
          {pendingReceivables > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-800 dark:text-blue-300">A Receber</span>
              </div>
              <span className="font-bold text-blue-700 dark:text-blue-300">{pendingReceivables}</span>
            </div>
          )}

          {pendingDebts > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm text-orange-800 dark:text-orange-300">A Pagar</span>
              </div>
              <span className="font-bold text-orange-700 dark:text-orange-300">{pendingDebts}</span>
            </div>
          )}

          {overdueCount === 0 && pendingReceivables === 0 && pendingDebts === 0 && (
            <div className="text-center py-4">
              <Target className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">Nenhuma pendência para este mês</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarStats;
