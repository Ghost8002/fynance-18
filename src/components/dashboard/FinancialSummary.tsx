
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, Target, Calendar, PieChart } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useFinancialPeriod } from "@/hooks/useFinancialPeriod";
import { formatFinancialPeriod } from "@/utils/financialPeriod";
import { PeriodType } from "@/components/dashboard/PeriodFilter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  calculatePeriodSummary, 
  calculateAccountBalanceFromTransactions,
  validateFinancialData,
  validateAndAutoFixFinancialData,
  safeToNumber 
} from "@/utils/financialCalculations";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

interface FinancialSummaryProps {
  hiddenWidgets?: string[];
  selectedPeriod?: PeriodType;
  customDateRange?: { from?: Date; to?: Date };
}

const FinancialSummary = ({ hiddenWidgets = [], selectedPeriod = 'current-month', customDateRange }: FinancialSummaryProps) => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading, error, refetch: refetchTransactions } = useSupabaseData('transactions', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: cards } = useSupabaseData('cards', user?.id);
  const { data: budgets } = useSupabaseData('budgets', user?.id);
  const { data: goals } = useSupabaseData('goals', user?.id);
  const { getFinancialPeriod } = useFinancialPeriod();
  const { toast } = useToast();
  const [hasAutoFixed, setHasAutoFixed] = useState(false);

  // Validar dados financeiros
  const validation = validateFinancialData(transactions || [], accounts || []);
  if (!validation.isValid) {
    console.warn('Dados financeiros inválidos:', validation.errors);
  }

  // Executar correção automática quando necessário
  useEffect(() => {
    const autoFixData = async () => {
      if (!user || !transactions || hasAutoFixed) return;
      
      try {
        const result = await validateAndAutoFixFinancialData(transactions, accounts || [], user.id);
        
        if (result.fixedCount > 0) {
          setHasAutoFixed(true);
          
          // Recarregar dados após correção
          setTimeout(() => {
            refetchTransactions();
          }, 1000);
        }
      } catch (error) {
        console.error('Erro na correção automática:', error);
      }
    };

    if (transactions && transactions.length > 0 && !hasAutoFixed) {
      autoFixData();
    }
  }, [user, transactions, accounts, hasAutoFixed, toast, refetchTransactions]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <p className="text-red-500">Erro ao carregar dados financeiros: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Determinar período atual (predefinido ou personalizado)
  const currentPeriod = (selectedPeriod === 'custom' && customDateRange?.from && customDateRange?.to && customDateRange.from <= customDateRange.to)
    ? { startDate: customDateRange.from as Date, endDate: customDateRange.to as Date }
    : getFinancialPeriod(selectedPeriod);

  // Calcular resumo financeiro usando a nova função
  const financialSummary = calculatePeriodSummary(
    transactions || [], 
    currentPeriod, 
    accounts || []
  );

  const { 
    totalIncome, 
    totalExpenses, 
    periodBalance: balance, 
    totalAccountBalance,
    transactionCount: thisMonthTransactions 
  } = financialSummary;
  
  const totalCreditLimit = cards.reduce((sum, card) => sum + toNumber(card.credit_limit), 0);
  const totalUsedCredit = cards.reduce((sum, card) => sum + toNumber(card.used_amount), 0);
  const totalAvailableCredit = totalCreditLimit - totalUsedCredit;
  const creditUsagePercentage = totalCreditLimit > 0 ? (totalUsedCredit / totalCreditLimit) * 100 : 0;
  const totalBudgetLimit = budgets.reduce((sum, budget) => sum + toNumber(budget.limit_amount), 0);
  const totalBudgetSpent = budgets.reduce((sum, budget) => sum + toNumber(budget.spent_amount), 0);
  const budgetUsagePercentage = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;
  const totalGoalsTarget = goals.reduce((sum, goal) => sum + toNumber(goal.target_amount), 0);
  const totalGoalsCurrent = goals.reduce((sum, goal) => sum + toNumber(goal.current_amount), 0);
  const goalsProgress = totalGoalsTarget > 0 ? (totalGoalsCurrent / totalGoalsTarget) * 100 : 0;

  // Filtrar transações do período para análise de categorias
  const currentPeriodTransactions = (transactions || []).filter(t => {
    const d = new Date(t.date);
    return d >= currentPeriod.startDate && d <= currentPeriod.endDate;
  });

  const expensesByCategory = currentPeriodTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const categoryName = t.category_id || 'Sem categoria';
      const currentAmount = toNumber(acc[categoryName] || 0);
      const transactionAmount = toNumber(t.amount);
      acc[categoryName] = currentAmount + transactionAmount;
      return acc;
    }, {} as Record<string, number>);

  const topCategory = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => toNumber(b) - toNumber(a))[0];

  const allSummaryCards = [
    {
      id: "income",
      title: "Receitas do Período",
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      description: `Período: ${formatFinancialPeriod(currentPeriod)}`,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      id: "expenses",
      title: "Despesas do Período",
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      description: `Período: ${formatFinancialPeriod(currentPeriod)}`,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    },
    {
      id: "balance",
      title: "Saldo do Período",
      value: formatCurrency(balance),
      icon: DollarSign,
      description: balance >= 0 ? "Resultado positivo" : "Resultado negativo",
      color: balance >= 0 ? "text-green-600" : "text-red-600",
      bgColor: balance >= 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
    },
    {
      id: "account-balance",
      title: "Saldo Total das Contas",
      value: formatCurrency(totalAccountBalance),
      icon: Wallet,
      description: "Calculado com base nas transações",
      color: totalAccountBalance >= 0 ? "text-blue-600" : "text-red-600",
      bgColor: totalAccountBalance >= 0 ? "bg-blue-100 dark:bg-blue-900/20" : "bg-red-100 dark:bg-red-900/20"
    },
    {
      id: "credit-limit",
      title: "Limite de Crédito Disponível",
      value: formatCurrency(totalAvailableCredit),
      icon: CreditCard,
      description: `${creditUsagePercentage.toFixed(1)}% utilizado`,
      color: creditUsagePercentage > 80 ? "text-red-600" : "text-blue-600",
      bgColor: creditUsagePercentage > 80 ? "bg-red-100 dark:bg-red-900/20" : "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      id: "budgets",
      title: "Orçamentos",
      value: `${budgetUsagePercentage.toFixed(1)}%`,
      icon: PieChart,
      description: `${formatCurrency(totalBudgetSpent)} de ${formatCurrency(totalBudgetLimit)}`,
      color: budgetUsagePercentage > 80 ? "text-red-600" : "text-green-600",
      bgColor: budgetUsagePercentage > 80 ? "bg-red-100 dark:bg-red-900/20" : "bg-green-100 dark:bg-green-900/20"
    },
    {
      id: "goals",
      title: "Progresso das Metas",
      value: `${goalsProgress.toFixed(1)}%`,
      icon: Target,
      description: `${formatCurrency(totalGoalsCurrent)} de ${formatCurrency(totalGoalsTarget)}`,
      color: goalsProgress > 50 ? "text-green-600" : "text-orange-600",
      bgColor: goalsProgress > 50 ? "bg-green-100 dark:bg-green-900/20" : "bg-orange-100 dark:bg-orange-900/20"
    },
    {
      id: "transactions",
      title: "Transações do Mês",
      value: thisMonthTransactions.toString(),
      icon: Calendar,
      description: topCategory ? `Maior gasto: ${formatCurrency(toNumber(topCategory[1]))}` : "Nenhum gasto registrado",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20"
    }
  ];

  // Filter out hidden widgets
  const visibleCards = allSummaryCards.filter(card => !hiddenWidgets.includes(card.id));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {visibleCards.map((card, index) => (
        <Card key={card.id} className="bg-card border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FinancialSummary;
