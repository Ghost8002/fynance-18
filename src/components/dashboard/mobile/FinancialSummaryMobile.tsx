import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Target, Calendar, BarChart3 } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useFinancialPeriod } from "@/hooks/useFinancialPeriod";
import { PeriodType } from "@/components/dashboard/PeriodFilter";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

interface FinancialSummaryMobileProps {
  hiddenWidgets?: string[];
  selectedPeriod?: PeriodType;
  customDateRange?: { from?: Date; to?: Date };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const toNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const FinancialSummaryMobile = ({ hiddenWidgets = [], selectedPeriod = 'current-month', customDateRange }: FinancialSummaryMobileProps) => {
  const { user } = useSupabaseAuth();
  const { filterTransactionsByPeriod } = useFinancialPeriod();
  const { data: transactions, loading: transactionsLoading } = useSupabaseData('transactions', user?.id);
  const { data: accounts, loading: accountsLoading } = useSupabaseData('accounts', user?.id);
  const { data: cards, loading: cardsLoading } = useSupabaseData('cards', user?.id);
  const { data: budgets, loading: budgetsLoading } = useSupabaseData('budgets', user?.id);
  const { data: goals, loading: goalsLoading } = useSupabaseData('goals', user?.id);

  const loading = transactionsLoading || accountsLoading || cardsLoading || budgetsLoading || goalsLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <DashboardSkeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  const filteredTransactions = (selectedPeriod === 'custom' && customDateRange?.from && customDateRange?.to && customDateRange.from <= customDateRange.to)
    ? transactions.filter(t => {
        const [year, month, day] = t.date.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        d.setHours(0, 0, 0, 0);
        return d >= (customDateRange.from as Date) && d <= (customDateRange.to as Date);
      })
    : filterTransactionsByPeriod(transactions, selectedPeriod);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + toNumber(t.amount), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + toNumber(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  const accountBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);

  const totalCreditLimit = cards.reduce((sum, card) => sum + toNumber(card.credit_limit), 0);
  const totalUsedCredit = cards.reduce((sum, card) => sum + toNumber(card.used_amount), 0);
  const availableCredit = totalCreditLimit - totalUsedCredit;

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + toNumber(b.limit_amount), 0);
  const totalBudgetUsed = budgets.reduce((sum, b) => {
    const spent = filteredTransactions
      .filter(t => t.type === 'expense' && t.category_id === b.category_id)
      .reduce((s, t) => s + toNumber(t.amount), 0);
    return sum + spent;
  }, 0);

  const totalGoalTarget = goals.reduce((sum, g) => sum + toNumber(g.target_amount), 0);
  const totalGoalCurrent = goals.reduce((sum, g) => sum + toNumber(g.current_amount), 0);
  const goalProgress = totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

  const monthTransactions = filteredTransactions.length;

  const allSummaryCards = [
    {
      id: 'income',
      title: 'Receitas',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/10'
    },
    {
      id: 'expenses',
      title: 'Despesas',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/10'
    },
    {
      id: 'balance',
      title: 'Saldo',
      value: formatCurrency(balance),
      icon: DollarSign,
      color: balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      bgColor: balance >= 0 ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'
    },
    {
      id: 'account-balance',
      title: 'Em Conta',
      value: formatCurrency(accountBalance),
      icon: Wallet,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10'
    },
    {
      id: 'credit-limit',
      title: 'Crédito',
      value: formatCurrency(availableCredit),
      icon: CreditCard,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/10'
    },
    {
      id: 'budgets',
      title: 'Orçamento',
      value: `${totalBudgetLimit > 0 ? Math.round((totalBudgetUsed / totalBudgetLimit) * 100) : 0}%`,
      icon: BarChart3,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/10'
    },
    {
      id: 'goals',
      title: 'Metas',
      value: `${Math.round(goalProgress)}%`,
      icon: Target,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/10'
    },
    {
      id: 'transactions',
      title: 'Transações',
      value: monthTransactions.toString(),
      icon: Calendar,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/10'
    }
  ];

  const visibleCards = allSummaryCards.filter(card => !hiddenWidgets.includes(card.id));

  return (
    <div className="grid grid-cols-2 gap-2">
      {visibleCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.id} className="border-border">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-muted-foreground">{card.title}</span>
                <div className={`p-1 rounded ${card.bgColor}`}>
                  <Icon className={`h-3 w-3 ${card.color}`} />
                </div>
              </div>
              <p className={`text-sm font-bold ${card.color}`}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FinancialSummaryMobile;
