
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useFinancialPeriod } from "@/hooks/useFinancialPeriod";
import { formatFinancialPeriod } from "@/utils/financialPeriod";
import { PeriodType } from "@/components/dashboard/PeriodFilter";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface TransactionSummaryProps {
  transactions: any[];
  period: string;
}

const TransactionSummary = ({ transactions, period }: TransactionSummaryProps) => {
  const { filterTransactionsByPeriod, getFinancialPeriod } = useFinancialPeriod();

  // Filtrar transações pelo período selecionado
  const periodTransactions = filterTransactionsByPeriod(transactions, period as PeriodType);
  const currentPeriod = getFinancialPeriod(period as PeriodType);

  // Calcular totais
  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  const getPeriodDescription = (period: string) => {
    switch (period) {
      case 'current-month':
        return `Período financeiro atual: ${formatFinancialPeriod(currentPeriod)}`;
      case 'last-month':
        return 'Mês anterior';
      case 'current-year':
        return 'Ano atual';
      case 'last-7-days':
        return 'Últimos 7 dias';
      case 'today':
        return 'Hoje';
      default:
        return `Período: ${formatFinancialPeriod(currentPeriod)}`;
    }
  };

  const summaryCards = [
    {
      title: "Total de Receitas",
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      description: getPeriodDescription(period),
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "Total de Despesas",
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      description: getPeriodDescription(period),
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    },
    {
      title: "Saldo Líquido",
      value: formatCurrency(balance),
      icon: DollarSign,
      description: balance >= 0 ? "Resultado positivo" : "Resultado negativo",
      color: balance >= 0 ? "text-green-600" : "text-red-600",
      bgColor: balance >= 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryCards.map((card, index) => (
        <Card key={index} className="bg-card border-border">
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

export default TransactionSummary;
