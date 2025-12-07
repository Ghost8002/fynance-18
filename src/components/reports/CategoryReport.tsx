
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState, useMemo } from "react";
import { usePeriodFilter } from "@/pages/Reports";

// Colors for the pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#F87171"];

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const CategoryReport = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading: transactionsLoading } = useSupabaseData('transactions', user?.id);
  const { data: categories, loading: categoriesLoading } = useSupabaseData('categories', user?.id);
  const { period, customStartDate, customEndDate } = usePeriodFilter();
  const [type, setType] = useState("expense");

  const chartData = useMemo(() => {
    if (!transactions || !categories) return [];

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    // Calcular período baseado no filtro global
    if (period === "custom" && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      switch (period) {
        case "current-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "last-month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case "last-3-months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case "last-6-months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case "last-12-months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case "current-year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case "last-year":
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }

    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate && t.type === type;
    });

    const categoryTotals = new Map();

    filteredTransactions.forEach(transaction => {
      // Find the category and ensure it matches the transaction type
      const category = categories.find(c => 
        c.id === transaction.category_id && c.type === type
      );
      const categoryName = category?.name || 'Sem categoria';
      const currentAmount = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, currentAmount + Number(transaction.amount));
    });

    return Array.from(categoryTotals.entries()).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [transactions, categories, period, type, customStartDate, customEndDate]);

  const loading = transactionsLoading || categoriesLoading;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando relatório...</div>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);
  const topCategory = chartData.length > 0 ? chartData[0] : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{type === 'expense' ? 'Despesas' : 'Receitas'} por Categoria</CardTitle>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Despesas</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-6">
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma transação de {type === 'expense' ? 'despesa' : 'receita'} encontrada para o período selecionado
          </div>
        ) : (
          <>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend 
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Categoria com maior {type === 'expense' ? 'gasto' : 'receita'}</p>
                  {topCategory && (
                    <div className="flex justify-between">
                      <p className="text-lg font-bold">{topCategory.name}</p>
                      <p className={`text-lg font-bold ${type === 'expense' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                        {formatCurrency(topCategory.value)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total {type === 'expense' ? 'Despesas' : 'Receitas'}</p>
                  <p className={`text-lg font-bold ${type === 'expense' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                    {formatCurrency(totalAmount)}
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

export default CategoryReport;
