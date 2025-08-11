import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
const BudgetProgress = () => {
  const {
    user
  } = useSupabaseAuth();
  const {
    data: budgets,
    loading: budgetsLoading,
    error
  } = useSupabaseData('budgets', user?.id);
  const {
    data: categories,
    loading: categoriesLoading
  } = useSupabaseData('categories', user?.id);
  const {
    data: transactions
  } = useSupabaseData('transactions', user?.id);
  const navigate = useNavigate();
  const loading = budgetsLoading || categoriesLoading;

  // Calculate current month expenses for each budget
  const currentDate = new Date();
  const currentMonthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === currentDate.getMonth() && transactionDate.getFullYear() === currentDate.getFullYear() && transaction.type === 'expense';
  });
  const budgetsWithSpent = budgets.map(budget => {
    const spent = currentMonthTransactions.filter(t => t.category_id === budget.category_id).reduce((sum, t) => sum + Number(t.amount), 0);
    const category = categories.find(c => c.id === budget.category_id);
    return {
      ...budget,
      spent,
      percentage: Math.round(spent / Number(budget.limit_amount) * 100),
      categoryName: category?.name || 'Categoria não encontrada'
    };
  });
  if (loading) {
    return <Card className="animate-fade-in bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Progresso dos Orçamentos</CardTitle>
          <CardDescription>Carregando orçamentos...</CardDescription>
        </CardHeader>
      </Card>;
  }
  if (error) {
    return <Card className="animate-fade-in bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Progresso dos Orçamentos</CardTitle>
          <CardDescription>Erro ao carregar orçamentos: {error}</CardDescription>
        </CardHeader>
      </Card>;
  }
  return <Card className="animate-fade-in bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-card-foreground">Progresso dos Orçamentos</CardTitle>
          <CardDescription>Acompanhe seus gastos por categoria</CardDescription>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {budgetsWithSpent.length === 0 ? <div className="text-center py-8">
            <Plus size={48} className="text-muted-foreground mb-4 mx-auto" />
            <p className="text-muted-foreground mb-4">Você ainda não definiu orçamentos</p>
            
          </div> : <div className="space-y-6">
            {budgetsWithSpent.map(budget => {
          const isOverBudget = budget.percentage > 100;
          return <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-card-foreground">{budget.categoryName}</span>
                    <span className={`text-sm font-medium ${isOverBudget ? 'text-primary' : 'text-muted-foreground'}`}>
                      {budget.percentage}%
                    </span>
                  </div>
                  <Progress value={Math.min(budget.percentage, 100)} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(budget.spent)} de {formatCurrency(Number(budget.limit_amount))}
                    </span>
                    {isOverBudget && <span className="text-xs text-primary font-medium">
                        Excedeu em {formatCurrency(budget.spent - Number(budget.limit_amount))}
                      </span>}
                  </div>
                </div>;
        })}
          </div>}
        
        <div className="mt-6 pt-4 border-t border-border text-center">
          <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm font-medium" onClick={() => navigate('/orcamentos')}>
            + Adicionar novo orçamento
          </Button>
        </div>
      </CardContent>
    </Card>;
};
export default BudgetProgress;