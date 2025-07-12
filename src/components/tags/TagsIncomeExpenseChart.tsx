
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { useTags } from "@/hooks/useTags";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TagsIncomeExpenseChart = () => {
  const { user } = useAuth();
  const { tags } = useTags();
  const { data: transactions, refetch: refetchTransactions } = useSupabaseData('transactions', user?.id);
  const [refreshKey, setRefreshKey] = useState(0);

  // Escuta eventos de transações adicionadas
  useEffect(() => {
    const handleTransactionAdded = async () => {
      console.log('TagsIncomeExpenseChart: Received transaction added event');
      await refetchTransactions();
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('transactionWithTagsAdded', handleTransactionAdded);
    return () => window.removeEventListener('transactionWithTagsAdded', handleTransactionAdded);
  }, [refetchTransactions]);

  const chartData = useMemo(() => {
    console.log('TagsIncomeExpenseChart: Processing chart data', {
      transactions: transactions?.length || 0,
      tags: tags?.length || 0
    });

    if (!transactions?.length || !tags?.length) {
      return { barData: [], pieData: [] };
    }

    // Filtrar apenas transações que têm tags
    const transactionsWithTags = transactions.filter(transaction => 
      transaction.tags && Array.isArray(transaction.tags) && transaction.tags.length > 0
    );

    const tagStats = tags.map(tag => {
      const tagTransactions = transactionsWithTags.filter(transaction =>
        transaction.tags.some((t: any) => t.id === tag.id)
      );

      const income = tagTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = tagTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        name: tag.name,
        color: tag.color,
        receitas: income,
        despesas: expenses,
        total: income + expenses
      };
    }).filter(tag => tag.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 tags

    const pieData = tagStats.map(tag => ({
      name: tag.name,
      value: tag.total,
      color: tag.color
    }));

    console.log('TagsIncomeExpenseChart: Chart data processed:', { barData: tagStats.length, pieData: pieData.length });
    return { barData: tagStats, pieData };
  }, [transactions, tags, refreshKey]);

  const chartConfig = {
    receitas: {
      label: "Receitas",
      color: "#10B981",
    },
    despesas: {
      label: "Despesas", 
      color: "#EF4444",
    },
  };

  if (chartData.barData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receitas e Despesas por Tags</CardTitle>
          <CardDescription>Visualização gráfica das movimentações por tag</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Nenhum dado disponível para exibir</p>
            <p className="text-sm">Adicione tags às suas transações para visualizar os gráficos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas e Despesas por Tags</CardTitle>
        <CardDescription>Visualização gráfica das movimentações por tag</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">Gráfico de Barras</TabsTrigger>
            <TabsTrigger value="pie">Gráfico de Pizza</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bar" className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value) => 
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                    }
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      name === 'receitas' ? 'Receitas' : 'Despesas'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
                  <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="pie" className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Total'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TagsIncomeExpenseChart;
