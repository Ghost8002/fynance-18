
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertTriangle, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { startOfDay, isBefore } from "date-fns";

interface Debt {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  description: string;
}

interface DebtStatsProps {
  debts: Debt[];
}

const DebtStats = ({ debts }: DebtStatsProps) => {
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    
    const pending = debts.filter(d => d.status === 'pending');
    const paid = debts.filter(d => d.status === 'paid');
    const overdue = debts.filter(d => {
      const due = startOfDay(new Date(d.due_date));
      return d.status === 'pending' && isBefore(due, today);
    });

    const totalAmount = debts.reduce((sum, d) => sum + Number(d.amount), 0);
    const pendingAmount = pending.reduce((sum, d) => sum + Number(d.amount), 0);
    const paidAmount = paid.reduce((sum, d) => sum + Number(d.amount), 0);
    const overdueAmount = overdue.reduce((sum, d) => sum + Number(d.amount), 0);

    const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return {
      total: debts.length,
      pending: pending.length,
      paid: paid.length,
      overdue: overdue.length,
      totalAmount,
      pendingAmount,
      paidAmount,
      overdueAmount,
      paidPercentage,
    };
  }, [debts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground truncate">
              {formatCurrency(stats.pendingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pagas</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground truncate">
              {formatCurrency(stats.paidAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground truncate">
              {formatCurrency(stats.overdueAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Taxa de Pagamento</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {stats.paidPercentage.toFixed(0)}%
            </div>
            <Progress value={stats.paidPercentage} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {stats.overdue > 0 && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  Atenção: {stats.overdue} dívida{stats.overdue > 1 ? 's' : ''} em atraso
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Total em atraso: {formatCurrency(stats.overdueAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DebtStats;
