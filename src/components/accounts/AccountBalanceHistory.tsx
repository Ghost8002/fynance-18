
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccountBalanceHistoryProps {
  accountId: string;
  accountName: string;
  currentBalance: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const AccountBalanceHistory = ({ accountId, accountName, currentBalance }: AccountBalanceHistoryProps) => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading } = useSupabaseData('transactions', user?.id);
  const [balanceHistory, setBalanceHistory] = useState<any[]>([]);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    if (transactions) {
      // Filtra transações desta conta dos últimos 30 dias
      const thirtyDaysAgo = subDays(new Date(), 30);
      const accountTransactions = transactions
        .filter(t => t.account_id === accountId && new Date(t.date) >= thirtyDaysAgo)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Cria array de todos os dias dos últimos 30 dias
      const dateRange = eachDayOfInterval({
        start: thirtyDaysAgo,
        end: new Date()
      });

      let runningBalance = currentBalance;
      
      // Calcula o saldo inicial (30 dias atrás)
      const totalChange = accountTransactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
      }, 0);
      
      let initialBalance = currentBalance - totalChange;
      
      const history = dateRange.map(date => {
        const dayTransactions = accountTransactions.filter(t => 
          format(new Date(t.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        
        const dayChange = dayTransactions.reduce((sum, t) => {
          return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
        }, 0);
        
        initialBalance += dayChange;
        
        return {
          date: format(date, 'dd/MM'),
          fullDate: format(date, 'dd/MM/yyyy'),
          balance: initialBalance,
          change: dayChange,
          transactions: dayTransactions.length
        };
      });

      setBalanceHistory(history);
      
      // Determina a tendência
      if (history.length >= 2) {
        const firstBalance = history[0].balance;
        const lastBalance = history[history.length - 1].balance;
        const difference = lastBalance - firstBalance;
        
        if (Math.abs(difference) < 50) {
          setTrend('stable');
        } else if (difference > 0) {
          setTrend('up');
        } else {
          setTrend('down');
        }
      }
    }
  }, [transactions, accountId, currentBalance]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'up': return 'Tendência de crescimento';
      case 'down': return 'Tendência de queda';
      default: return 'Saldo estável';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Evolução do Saldo - {accountName}</CardTitle>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className="text-sm text-gray-600">{getTrendText()}</span>
          </div>
        </div>
        <CardDescription>
          Últimos 30 dias • Saldo atual: {formatCurrency(currentBalance)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {balanceHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Não há dados suficientes para mostrar o histórico</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={balanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Saldo']}
                  labelFormatter={(label) => {
                    const item = balanceHistory.find(h => h.date === label);
                    return item ? item.fullDate : label;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Maior Saldo</p>
                <p className="font-semibold">
                  {formatCurrency(Math.max(...balanceHistory.map(h => h.balance)))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Menor Saldo</p>
                <p className="font-semibold">
                  {formatCurrency(Math.min(...balanceHistory.map(h => h.balance)))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Variação</p>
                <p className={`font-semibold ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatCurrency(balanceHistory[balanceHistory.length - 1]?.balance - balanceHistory[0]?.balance || 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
