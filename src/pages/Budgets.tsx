import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import BudgetList from "@/components/budgets/BudgetList";
import BudgetForm from "@/components/budgets/BudgetForm";
import BudgetAlert from "@/components/budgets/BudgetAlert";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, TrendingUp, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { parseLocalDate } from "@/utils/dateValidation";

const Budgets = () => {
  const { user } = useAuth();
  const { data: budgets } = useRealtimeData('budgets');
  const { data: categories } = useRealtimeData('categories');
  const { data: transactions } = useRealtimeData('transactions');

  // Calculate budget statistics
  const budgetStats = useMemo(() => {
    if (!budgets || !transactions || !categories) {
      return {
        totalBudgets: 0,
        totalLimit: 0,
        totalSpent: 0,
        averageUsage: 0,
        overBudgetCount: 0,
        nearLimitCount: 0,
        onTrackCount: 0
      };
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthTransactions = transactions.filter(transaction => {
      const transactionDate = parseLocalDate(transaction.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear && 
             transaction.type === 'expense';
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);

    let totalLimit = 0;
    let totalSpent = 0;
    let overBudgetCount = 0;
    let nearLimitCount = 0;
    let onTrackCount = 0;

    budgets.forEach(budget => {
      const budgetSpent = currentMonthTransactions
        .filter(t => t.category_id === budget.category_id)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      
      const limit = Number(budget.limit_amount);
      const percentage = (budgetSpent / limit) * 100;
      
      totalLimit += limit;
      totalSpent += budgetSpent;
      
      if (percentage >= 100) {
        overBudgetCount++;
      } else if (percentage >= 80) {
        nearLimitCount++;
      } else {
        onTrackCount++;
      }
    });

    const averageUsage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    return {
      totalBudgets: budgets.length,
      totalLimit,
      totalSpent,
      averageUsage,
      overBudgetCount,
      nearLimitCount,
      onTrackCount
    };
  }, [budgets, transactions, categories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="space-y-3 md:space-y-6">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">Orçamentos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Defina limites de gastos por categoria e acompanhe seu progresso</p>
          </div>
          
          <div className="flex justify-end">
            <BudgetForm />
          </div>
        </div>

        {/* Budget Statistics */}
        {budgetStats.totalBudgets > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <Card className="p-2 md:p-4">
              <CardHeader className="p-0 pb-1 md:pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">Total</CardTitle>
                  <PiggyBank className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-sm md:text-2xl font-bold">{budgetStats.totalBudgets}</div>
                <p className="text-[9px] md:text-xs text-muted-foreground">categorias</p>
              </CardContent>
            </Card>

            <Card className="p-2 md:p-4">
              <CardHeader className="p-0 pb-1 md:pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">Limite</CardTitle>
                  <Target className="h-3 w-3 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-sm md:text-2xl font-bold truncate">{formatCurrency(budgetStats.totalLimit)}</div>
                <p className="text-[9px] md:text-xs text-muted-foreground">definido</p>
              </CardContent>
            </Card>

            <Card className="p-2 md:p-4">
              <CardHeader className="p-0 pb-1 md:pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">Gasto</CardTitle>
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-orange-500 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-sm md:text-2xl font-bold truncate">{formatCurrency(budgetStats.totalSpent)}</div>
                <p className="text-[9px] md:text-xs text-muted-foreground">utilizado</p>
              </CardContent>
            </Card>

            <Card className="p-2 md:p-4">
              <CardHeader className="p-0 pb-1 md:pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">Uso Médio</CardTitle>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {budgetStats.averageUsage >= 100 ? (
                      <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                    ) : budgetStats.averageUsage >= 80 ? (
                      <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-sm md:text-2xl font-bold">{budgetStats.averageUsage.toFixed(0)}%</div>
                <Progress value={budgetStats.averageUsage} className="h-1 md:h-1.5 mt-1" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Budget Status Summary */}
        {budgetStats.totalBudgets > 0 && (
          <div className="flex flex-wrap gap-2">
            {budgetStats.overBudgetCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {budgetStats.overBudgetCount} excedido{budgetStats.overBudgetCount > 1 ? 's' : ''}
              </Badge>
            )}
            {budgetStats.nearLimitCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {budgetStats.nearLimitCount} próximo{budgetStats.nearLimitCount > 1 ? 's' : ''} do limite
              </Badge>
            )}
            {budgetStats.onTrackCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                {budgetStats.onTrackCount} no controle
              </Badge>
            )}
          </div>
        )}
        
        <BudgetAlert budgets={budgets} categories={categories} />
        
        <BudgetList />
      </div>
    </AppLayout>
  );
};

export default Budgets;
