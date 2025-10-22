import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { parseLocalDate } from "@/utils/dateValidation";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const BudgetProgressMobile = () => {
  const { user } = useSupabaseAuth();
  const { data: budgets, loading: budgetsLoading } = useSupabaseData('budgets', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: transactions } = useSupabaseData('transactions', user?.id);

  if (budgetsLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Orçamentos</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const currentDate = new Date();
  const currentMonthTransactions = transactions.filter(transaction => {
    const transactionDate = parseLocalDate(transaction.date);
    return transactionDate.getMonth() === currentDate.getMonth() 
      && transactionDate.getFullYear() === currentDate.getFullYear() 
      && transaction.type === 'expense';
  });

  const budgetsWithSpent = budgets.map(budget => {
    const spent = currentMonthTransactions
      .filter(t => t.category_id === budget.category_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const category = categories.find(c => c.id === budget.category_id);
    return {
      ...budget,
      spent,
      percentage: Math.round((spent / Number(budget.limit_amount)) * 100),
      categoryName: category?.name || 'Categoria'
    };
  }).slice(0, 3);

  if (budgets.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum orçamento definido
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Orçamentos</CardTitle>
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {budgetsWithSpent.map(budget => {
          const isOverBudget = budget.percentage > 100;
          return (
            <div key={budget.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-foreground truncate">
                  {budget.categoryName}
                </span>
                <span className={`text-[10px] font-medium ${isOverBudget ? 'text-primary' : 'text-muted-foreground'}`}>
                  {budget.percentage}%
                </span>
              </div>
              <Progress value={Math.min(budget.percentage, 100)} className="h-1" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">
                  {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.limit_amount))}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default BudgetProgressMobile;
