
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState, useMemo } from "react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const TrendAnalysisReport = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading: transactionsLoading } = useSupabaseData('transactions', user?.id);
  const { data: categories, loading: categoriesLoading } = useSupabaseData('categories', user?.id);
  const [period, setPeriod] = useState("12months");
  const [analysisType, setAnalysisType] = useState("general");

  const loading = transactionsLoading || categoriesLoading;

  const trendData = useMemo(() => {
    if (!transactions) return [];

    const now = new Date();
    const months = period === "6months" ? 6 : period === "12months" ? 12 : 24;
    
    const monthsData = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
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
        despesas,
        saldo: receitas - despesas,
        transacoes: monthTransactions.length
      });
    }

    return monthsData;
  }, [transactions, period]);

  const categoryTrends = useMemo(() => {
    if (!transactions || !categories) return [];

    const now = new Date();
    const months = 6;
    
    const categoryData = new Map();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthTransactions = transactions.filter(t => {
        const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
        return transactionMonth === monthKey && t.type === 'expense';
      });

      categories.forEach(category => {
        const categoryExpenses = monthTransactions
          .filter(t => t.category_id === category.id)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        if (!categoryData.has(category.name)) {
          categoryData.set(category.name, []);
        }
        
        categoryData.get(category.name).push({
          month: monthName,
          value: categoryExpenses
        });
      });
    }

    return Array.from(categoryData.entries())
      .map(([name, data]) => ({
        name,
        data,
        total: data.reduce((sum, item) => sum + item.value, 0),
        average: data.reduce((sum, item) => sum + item.value, 0) / data.length,
        trend: data.length > 1 ? 
          ((data[data.length - 1].value - data[0].value) / Math.max(data[0].value, 1)) * 100 : 0
      }))
      .filter(category => category.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions, categories]);

  const insights = useMemo(() => {
    if (trendData.length < 2) return [];

    const insights = [];
    
    // Análise de receitas
    const receitasRecentes = trendData.slice(-3).reduce((sum, item) => sum + item.receitas, 0) / 3;
    const receitasAnteriores = trendData.slice(-6, -3).reduce((sum, item) => sum + item.receitas, 0) / 3;
    const variacaoReceitas = ((receitasRecentes - receitasAnteriores) / Math.max(receitasAnteriores, 1)) * 100;

    if (Math.abs(variacaoReceitas) > 10) {
      insights.push({
        type: variacaoReceitas > 0 ? 'positive' : 'negative',
        title: 'Tendência de Receitas',
        description: `Suas receitas ${variacaoReceitas > 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(variacaoReceitas).toFixed(1)}% nos últimos 3 meses.`,
        impact: Math.abs(variacaoReceitas) > 20 ? 'high' : 'medium'
      });
    }

    // Análise de despesas
    const despesasRecentes = trendData.slice(-3).reduce((sum, item) => sum + item.despesas, 0) / 3;
    const despesasAnteriores = trendData.slice(-6, -3).reduce((sum, item) => sum + item.despesas, 0) / 3;
    const variacaoDespesas = ((despesasRecentes - despesasAnteriores) / Math.max(despesasAnteriores, 1)) * 100;

    if (Math.abs(variacaoDespesas) > 10) {
      insights.push({
        type: variacaoDespesas > 0 ? 'negative' : 'positive',
        title: 'Tendência de Despesas',
        description: `Suas despesas ${variacaoDespesas > 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(variacaoDespesas).toFixed(1)}% nos últimos 3 meses.`,
        impact: Math.abs(variacaoDespesas) > 20 ? 'high' : 'medium'
      });
    }

    // Análise de categorias
    categoryTrends.forEach(category => {
      if (Math.abs(category.trend) > 25) {
        insights.push({
          type: category.trend > 0 ? 'warning' : 'positive',
          title: `Categoria: ${category.name}`,
          description: `Gastos com ${category.name} ${category.trend > 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(category.trend).toFixed(1)}% no período.`,
          impact: Math.abs(category.trend) > 50 ? 'high' : 'medium'
        });
      }
    });

    return insights.slice(0, 5);
  }, [trendData, categoryTrends]);

  const statistics = useMemo(() => {
    if (trendData.length === 0) return {};

    const totalReceitas = trendData.reduce((sum, item) => sum + item.receitas, 0);
    const totalDespesas = trendData.reduce((sum, item) => sum + item.despesas, 0);
    const mediaReceitas = totalReceitas / trendData.length;
    const mediaDespesas = totalDespesas / trendData.length;
    const crescimentoReceitas = trendData.length > 1 ? 
      ((trendData[trendData.length - 1].receitas - trendData[0].receitas) / Math.max(trendData[0].receitas, 1)) * 100 : 0;
    const crescimentoDespesas = trendData.length > 1 ? 
      ((trendData[trendData.length - 1].despesas - trendData[0].despesas) / Math.max(trendData[0].despesas, 1)) * 100 : 0;

    return {
      totalReceitas,
      totalDespesas,
      mediaReceitas,
      mediaDespesas,
      crescimentoReceitas,
      crescimentoDespesas
    };
  }, [trendData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando análise de tendências...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Análise de Tendências</CardTitle>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">6 meses</SelectItem>
              <SelectItem value="12months">12 meses</SelectItem>
              <SelectItem value="24months">24 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Análise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Geral</SelectItem>
              <SelectItem value="categories">Categorias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Insights Cards */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Insights Principais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((insight, index) => (
                <Card key={index} className={`border-l-4 ${
                  insight.type === 'positive' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' :
                  insight.type === 'negative' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
                  'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {insight.impact === 'high' ? 'Alto' : 'Médio'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{insight.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Receita Média</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(statistics.mediaReceitas || 0)}</p>
                <p className={`text-xs ${statistics.crescimentoReceitas >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {statistics.crescimentoReceitas >= 0 ? '+' : ''}{statistics.crescimentoReceitas?.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Despesa Média</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(statistics.mediaDespesas || 0)}</p>
                <p className={`text-xs ${statistics.crescimentoDespesas <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {statistics.crescimentoDespesas >= 0 ? '+' : ''}{statistics.crescimentoDespesas?.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Receitas</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(statistics.totalReceitas || 0)}</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Despesas</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(statistics.totalDespesas || 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        {analysisType === 'general' ? (
          <div className="h-[400px] mb-6">
            <h3 className="text-lg font-semibold mb-4">Tendência Geral - Receitas vs Despesas</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${value/1000}K`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Legend />
                <Area type="monotone" dataKey="receitas" stackId="1" name="Receitas" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="despesas" stackId="2" name="Despesas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                <Line type="monotone" dataKey="saldo" name="Saldo Líquido" stroke="#0c6291" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Tendências por Categoria (Top 5)</h3>
            {categoryTrends.map((category, index) => (
              <Card key={category.name} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{category.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={Math.abs(category.trend) > 25 ? 'destructive' : 'secondary'}>
                        {category.trend >= 0 ? '+' : ''}{category.trend.toFixed(1)}%
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Média: {formatCurrency(category.average)}
                      </span>
                    </div>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={category.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `R$ ${value/1000}K`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#0c6291" 
                          strokeWidth={2}
                          dot={{ fill: '#0c6291', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendAnalysisReport;
