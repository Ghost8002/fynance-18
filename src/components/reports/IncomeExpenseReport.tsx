
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useMemo } from "react";
import { usePeriodFilter } from "@/pages/Reports";

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
  const { period, customStartDate, customEndDate } = usePeriodFilter();

  const chartData = useMemo(() => {
    if (!transactions) return [];

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let months = 1;

    // Calcular período baseado no filtro global
    if (period === "custom" && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      // Calcular diferença em meses para o período personalizado
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      months = Math.max(1, Math.ceil(diffDays / 30)); // Aproximação de meses
    } else {
      switch (period) {
        case "current-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          months = 1;
          break;
        case "last-month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          months = 1;
          break;
        case "last-3-months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          months = 3;
          break;
        case "last-6-months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          months = 6;
          break;
        case "last-12-months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          months = 12;
          break;
        case "current-year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          months = 12;
          break;
        case "last-year":
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          months = 12;
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          months = 1;
      }
    }
    
    const monthsData = [];
    
    if (period === "custom" && customStartDate && customEndDate) {
      // Para período personalizado, agrupar por mês dentro do período
      const currentDate = new Date(startDate);
      const endDateCopy = new Date(endDate);
      
      while (currentDate <= endDateCopy) {
        const monthKey = currentDate.toISOString().slice(0, 7);
        const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          const transactionMonth = transactionDate.toISOString().slice(0, 7);
          return transactionMonth === monthKey && 
                 transactionDate >= startDate && 
                 transactionDate <= endDate;
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

        // Avançar para o próximo mês
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
      }
    } else {
      // Para períodos predefinidos, usar a lógica original
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
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
    }

    return monthsData;
  }, [transactions, period, customStartDate, customEndDate]);

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
      <CardHeader>
        <CardTitle>Receitas vs. Despesas</CardTitle>
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
