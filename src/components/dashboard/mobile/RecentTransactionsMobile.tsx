import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { compareDateStrings } from "@/utils/dateValidation";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(date));
};

const RecentTransactionsMobile = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading } = useSupabaseData('transactions', user?.id);

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Transações Recentes</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const recentTransactions = transactions
    .sort((a, b) => compareDateStrings(b.date, a.date))
    .slice(0, 4);

  if (recentTransactions.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma transação encontrada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {recentTransactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="flex items-center justify-between p-2 border border-border rounded-lg"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`p-1 rounded-full ${
                transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowUpIcon className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowDownIcon className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{transaction.description}</p>
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(transaction.date)}
                </span>
              </div>
            </div>
            <div className={`text-xs font-bold flex-shrink-0 ml-2 ${
              transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentTransactionsMobile;
