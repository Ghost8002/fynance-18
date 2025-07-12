
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const IncomeExpenseReport = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading } = useSupabaseData('transactions', user?.id);
  const [period, setPeriod] = useState("6months");

  const chartData = useMemo(() => {
    if (!transactions) return [];

    const now = new Date();
    const months = period === "3months" ? 3 : period === "6months" ? 6 : 12;
    
    const monthsData = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthTransactions = transactions.filter(t => {
        const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
        return transactionMonth === monthKey;
      });

      const receitas = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const despesas = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthsData.push({
        month: monthName,
        receitas,
        despesas
      });
    }

    return monthsData;
  }, [transactions, period]);

  const totals = useMemo(() => {
    const totalReceitas = chartData.reduce((sum, item) => sum + item.receitas, 0);
    const totalDespesas = chartData.reduce((sum, item) => sum + item.despesas, 0);
    const saldo = totalReceitas - totalDespesas;

    return { totalReceitas, totalDespesas, saldo };
  }, [chartData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando relatório...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Receitas vs. Despesas</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Últimos 3 meses</SelectItem>
            <SelectItem value="6months">Últimos 6 meses</SelectItem>
            <SelectItem value="1year">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => `R$ ${value/1000}K`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-gray-50">
            <CardContent className="p-4 flex flex-col items-center">
              <p className="text-sm text-gray-500">Total Receitas</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(totals.totalReceitas)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardContent className="p-4 flex flex-col items-center">
              <p className="text-sm text-gray-500">Total Despesas</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(totals.totalDespesas)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardContent className="p-4 flex flex-col items-center">
              <p className="text-sm text-gray-500">Saldo</p>
              <p className={`text-2xl font-bold ${
                totals.saldo >= 0 ? "text-green-500" : "text-red-500"
              }`}>
                {formatCurrency(totals.saldo)}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseReport;
