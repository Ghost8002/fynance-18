
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState, useMemo } from "react";

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
  const [period, setPeriod] = useState("month");
  const [type, setType] = useState("expense");

  const chartData = useMemo(() => {
    if (!transactions || !categories) return [];

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && t.type === type;
    });

    const categoryTotals = new Map();

    filteredTransactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.category_id);
      const categoryName = category?.name || 'Sem categoria';
      const currentAmount = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, currentAmount + Number(transaction.amount));
    });

    return Array.from(categoryTotals.entries()).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [transactions, categories, period, type]);

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
        <div className="flex space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Despesas</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma transação encontrada para o período selecionado
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
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Categoria com maior {type === 'expense' ? 'gasto' : 'receita'}</p>
                  {topCategory && (
                    <div className="flex justify-between">
                      <p className="text-lg font-bold">{topCategory.name}</p>
                      <p className={`text-lg font-bold ${type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                        {formatCurrency(topCategory.value)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Total {type === 'expense' ? 'Despesas' : 'Receitas'}</p>
                  <p className={`text-lg font-bold ${type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
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
