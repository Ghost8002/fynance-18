
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const BudgetList = () => {
  const { user } = useSupabaseAuth();
  const { data: budgets, loading, error, remove } = useSupabaseData('budgets', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: transactions } = useSupabaseData('transactions', user?.id);
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create category map for lookup
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);

  // Calculate spending for each budget
  const budgetsWithSpending = budgets.map(budget => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const categoryTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transaction.category_id === budget.category_id &&
             transaction.type === 'expense' &&
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });
    
    const spent = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      ...budget,
      categoryName: categoryMap[budget.category_id] || 'Categoria removida',
      spent,
    };
  });

  const handleDelete = async (budgetId: string) => {
    setDeletingId(budgetId);
    
    try {
      const { error } = await remove(budgetId);
      
      if (error) {
        throw new Error(error);
      }
      
      toast({
        title: "Sucesso",
        description: "Orçamento removido com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o orçamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando orçamentos...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Erro ao carregar orçamentos: {error}</div>;
  }

  if (budgetsWithSpending.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center p-6 border-dashed">
          <Plus size={48} className="text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Criar Orçamento</h3>
          <p className="text-gray-500 text-center mb-4">
            Defina limites de gastos por categoria
          </p>
          <Button>Criar Orçamento</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {budgetsWithSpending.map((budget) => {
        const percentUsed = (budget.spent / Number(budget.limit_amount)) * 100;
        const isOverBudget = percentUsed > 100;
        const isNearLimit = percentUsed >= 80 && percentUsed < 100;
        const remaining = Number(budget.limit_amount) - budget.spent;
        
        return (
          <Card key={budget.id} className={isOverBudget ? "border-red-300" : ""}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{budget.categoryName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{budget.period}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isOverBudget && (
                    <AlertCircle size={20} className="text-red-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(budget.id)}
                    disabled={deletingId === budget.id}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">
                    {formatCurrency(budget.spent)} de {formatCurrency(Number(budget.limit_amount))}
                  </span>
                  <span 
                    className={`text-sm font-medium ${
                      isOverBudget ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-green-500"
                    }`}
                  >
                    {isOverBudget ? `${formatCurrency(Math.abs(remaining))} acima` : `${formatCurrency(remaining)} restantes`}
                  </span>
                </div>
                
                <Progress 
                  value={percentUsed > 100 ? 100 : percentUsed} 
                  className={`h-2`}
                  indicatorClassName={isOverBudget ? "bg-red-600" : isNearLimit ? "bg-amber-600" : "bg-green-600"}
                />
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">
                    {percentUsed.toFixed(0)}% utilizado
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className="flex flex-col items-center justify-center p-6 border-dashed">
        <Plus size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Criar Orçamento</h3>
        <p className="text-gray-500 text-center mb-4">
          Defina limites de gastos por categoria
        </p>
        <Button>Criar Orçamento</Button>
      </Card>
    </div>
  );
};

export default BudgetList;
