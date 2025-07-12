
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState, useMemo } from "react";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const MonthlyReport = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading: transactionsLoading } = useSupabaseData('transactions', user?.id);
  const { data: accounts, loading: accountsLoading } = useSupabaseData('accounts', user?.id);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const chartData = useMemo(() => {
    if (!transactions || !accounts) return [];

    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const dailyData = [];
    for (let day = 1; day <= Math.min(daysInMonth, 30); day += 5) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate balance up to this date
      const transactionsUpToDate = transactions.filter(t => t.date <= dateStr);
      
      let balance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
      
      transactionsUpToDate.forEach(transaction => {
        if (transaction.type === 'income') {
          balance += Number(transaction.amount);
        } else {
          balance -= Number(transaction.amount);
        }
      });

      dailyData.push({
        date: String(day).padStart(2, '0'),
        saldo: balance
      });
    }

    return dailyData;
  }, [transactions, accounts, selectedMonth]);

  const loading = transactionsLoading || accountsLoading;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getMonthName = (monthValue: string) => {
    const [year, month] = monthValue.split('-').map(Number);
    return `${monthNames[month - 1]} ${year}`;
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      options.push({ value, label });
    }
    
    return options;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando relatório...</div>
        </CardContent>
      </Card>
    );
  }

  const initialBalance = chartData.length > 0 ? chartData[0].saldo : 0;
  const finalBalance = chartData.length > 0 ? chartData[chartData.length - 1].saldo : 0;
  const variation = finalBalance - initialBalance;
  const variationPercent = initialBalance !== 0 ? (variation / Math.abs(initialBalance)) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Evolução do Saldo</CardTitle>
          <Badge variant="outline" className="mt-1">{getMonthName(selectedMonth)}</Badge>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {generateMonthOptions().map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-6">
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum dado encontrado para o mês selecionado
          </div>
        ) : (
          <>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => `Dia ${value}`}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${value/1000}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    name="Saldo"
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="bg-gray-50">
                <CardContent className="p-4 flex flex-col items-center">
                  <p className="text-sm text-gray-500">Saldo Inicial</p>
                  <p className="text-2xl font-bold">{formatCurrency(initialBalance)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardContent className="p-4 flex flex-col items-center">
                  <p className="text-sm text-gray-500">Saldo Final</p>
                  <p className="text-2xl font-bold">{formatCurrency(finalBalance)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardContent className="p-4 flex flex-col items-center">
                  <p className="text-sm text-gray-500">Variação</p>
                  <p className={`text-2xl font-bold ${
                    variation >= 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {formatCurrency(variation)}
                    <span className="text-sm ml-1">
                      ({variationPercent.toFixed(1)}%)
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyReport;
