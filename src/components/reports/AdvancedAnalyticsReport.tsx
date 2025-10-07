import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Brain, Calculator, PieChart as PieChartIcon } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { usePeriodFilter } from "@/pages/Reports";
import { useState, useMemo } from "react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#F87171"];

const AdvancedAnalyticsReport = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading: transactionsLoading } = useSupabaseData('transactions', user?.id);
  const { data: categories, loading: categoriesLoading } = useSupabaseData('categories', user?.id);
  const { data: accounts, loading: accountsLoading } = useSupabaseData('accounts', user?.id);
  const { data: budgets, loading: budgetsLoading } = useSupabaseData('budgets', user?.id);
  
  const { period, customStartDate, customEndDate } = usePeriodFilter();
  const [analysisType, setAnalysisType] = useState("financial-metrics");

  const loading = transactionsLoading || categoriesLoading || accountsLoading || budgetsLoading;

  // Análise de Sazonalidade
  const seasonalityAnalysis = useMemo(() => {
    if (!transactions) return [];

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
          startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      }
    }

    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Agrupar por mês dentro do período
    const monthlyData = [];
    const currentDate = new Date(startDate);
    const endDateCopy = new Date(endDate);
    
    while (currentDate <= endDateCopy) {
      const monthKey = currentDate.toISOString().slice(0, 7);
      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      const monthTransactions = periodTransactions.filter(t => {
        const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
        return transactionMonth === monthKey;
      });

      const receitas = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const despesas = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthlyData.push({
        month: monthName,
        receitas,
        despesas,
        saldo: receitas - despesas,
        transacoes: monthTransactions.length
      });

      // Avançar para o próximo mês
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
    }

    return monthlyData;
  }, [transactions, period, customStartDate, customEndDate]);

  // Métricas Financeiras Avançadas
  const financialMetrics = useMemo(() => {
    if (!transactions || !accounts) return {};

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
          startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      }
    }

    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const receitas = periodTransactions.filter(t => t.type === 'income');
    const despesas = periodTransactions.filter(t => t.type === 'expense');

    const totalReceitas = receitas.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalAccountBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

    // Margem de Lucro
    const margemLucro = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0;

    // Taxa de Poupança
    const taxaPoupanca = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0;

    // Receita por Transação
    const receitaPorTransacao = receitas.length > 0 ? totalReceitas / receitas.length : 0;

    // Despesa por Transação
    const despesaPorTransacao = despesas.length > 0 ? totalDespesas / despesas.length : 0;

    // Variabilidade dos Gastos (Coeficiente de Variação)
    const gastosMensais = seasonalityAnalysis.map(m => m.despesas);
    const mediaGastos = gastosMensais.reduce((sum, g) => sum + g, 0) / gastosMensais.length;
    const varianciaGastos = gastosMensais.reduce((sum, g) => sum + Math.pow(g - mediaGastos, 2), 0) / gastosMensais.length;
    const desvioPadraoGastos = Math.sqrt(varianciaGastos);
    const coeficienteVariacao = mediaGastos > 0 ? (desvioPadraoGastos / mediaGastos) * 100 : 0;

    // Liquidez (Saldo / Despesas Mensais Médias)
    const despesaMediaMensal = totalDespesas / 12;
    const liquidez = despesaMediaMensal > 0 ? totalAccountBalance / despesaMediaMensal : 0;

    return {
      margemLucro,
      taxaPoupanca,
      receitaPorTransacao,
      despesaPorTransacao,
      coeficienteVariacao,
      liquidez,
      totalReceitas,
      totalDespesas,
      totalAccountBalance,
      totalTransacoes: periodTransactions.length
    };
  }, [transactions, accounts, seasonalityAnalysis, period, customStartDate, customEndDate]);

  // Análise de Padrões de Gastos
  const spendingPatterns = useMemo(() => {
    if (!transactions || !categories) return [];

    const now = new Date();
    const last6Months = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      return transactionDate >= sixMonthsAgo && t.type === 'expense';
    });

    const categoryAnalysis = new Map();

    last6Months.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.category_id);
      const categoryName = category?.name || 'Sem categoria';
      
      if (!categoryAnalysis.has(categoryName)) {
        categoryAnalysis.set(categoryName, {
          total: 0,
          count: 0,
          average: 0,
          trend: [],
          color: category?.color || '#3B82F6'
        });
      }

      const analysis = categoryAnalysis.get(categoryName);
      analysis.total += Number(transaction.amount);
      analysis.count += 1;
      analysis.average = analysis.total / analysis.count;

      // Adicionar ao histórico mensal para análise de tendência
      const month = new Date(transaction.date).toISOString().slice(0, 7);
      const existingMonth = analysis.trend.find(t => t.month === month);
      if (existingMonth) {
        existingMonth.amount += Number(transaction.amount);
      } else {
        analysis.trend.push({ month, amount: Number(transaction.amount) });
      }
    });

    return Array.from(categoryAnalysis.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        trend: data.trend.sort((a, b) => a.month.localeCompare(b.month))
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [transactions, categories]);

  // Insights Automáticos
  const insights = useMemo(() => {
    const insightsList = [];

    // Insight sobre Margem de Lucro
    if (financialMetrics.margemLucro > 20) {
      insightsList.push({
        type: 'positive',
        icon: CheckCircle,
        title: 'Excelente Margem de Lucro',
        description: `Sua margem de lucro é de ${financialMetrics.margemLucro.toFixed(1)}%, indicando boa saúde financeira.`,
        impact: 'high'
      });
    } else if (financialMetrics.margemLucro < 0) {
      insightsList.push({
        type: 'negative',
        icon: AlertTriangle,
        title: 'Margem de Lucro Negativa',
        description: `Sua margem de lucro é negativa (${financialMetrics.margemLucro.toFixed(1)}%). Considere reduzir gastos ou aumentar receitas.`,
        impact: 'high'
      });
    }

    // Insight sobre Liquidez
    if (financialMetrics.liquidez > 6) {
      insightsList.push({
        type: 'positive',
        icon: CheckCircle,
        title: 'Boa Liquidez',
        description: `Você tem reserva para ${financialMetrics.liquidez.toFixed(1)} meses de gastos.`,
        impact: 'medium'
      });
    } else if (financialMetrics.liquidez < 3) {
      insightsList.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Baixa Liquidez',
        description: `Você tem reserva para apenas ${financialMetrics.liquidez.toFixed(1)} meses. Considere aumentar sua reserva de emergência.`,
        impact: 'high'
      });
    }

    // Insight sobre Variabilidade
    if (financialMetrics.coeficienteVariacao > 30) {
      insightsList.push({
        type: 'warning',
        icon: TrendingUp,
        title: 'Alta Variabilidade nos Gastos',
        description: `Seus gastos variam muito (${financialMetrics.coeficienteVariacao.toFixed(1)}% de variação). Tente manter mais consistência.`,
        impact: 'medium'
      });
    }

    // Insight sobre Categoria com Maior Gasto
    if (spendingPatterns.length > 0) {
      const topCategory = spendingPatterns[0];
      const percentage = (topCategory.total / financialMetrics.totalDespesas) * 100;
      
      if (percentage > 40) {
        insightsList.push({
          type: 'warning',
          icon: Target,
          title: 'Concentração de Gastos',
          description: `${percentage.toFixed(1)}% dos seus gastos estão em "${topCategory.name}". Considere diversificar.`,
          impact: 'medium'
        });
      }
    }

    return insightsList;
  }, [financialMetrics, spendingPatterns]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando análise avançada...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Análise Avançada
        </CardTitle>
        <div className="flex gap-2">
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Análise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial-metrics">Métricas Financeiras</SelectItem>
              <SelectItem value="seasonality">Sazonalidade</SelectItem>
              <SelectItem value="patterns">Padrões de Gastos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Insights Automáticos */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Insights Inteligentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((insight, index) => (
                <Card key={index} className={`border-l-4 ${
                  insight.type === 'positive' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' :
                  insight.type === 'negative' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
                  'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <insight.icon className={`h-5 w-5 mt-0.5 ${
                        insight.type === 'positive' ? 'text-green-600 dark:text-green-400' :
                        insight.type === 'negative' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">{insight.title}</h4>
                          <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                            {insight.impact === 'high' ? 'Alto' : 'Médio'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{insight.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Métricas Financeiras */}
        {analysisType === 'financial-metrics' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Margem de Lucro</p>
                  </div>
                  <p className={`text-2xl font-bold ${
                    financialMetrics.margemLucro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPercentage(financialMetrics.margemLucro)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Taxa de Poupança</p>
                  </div>
                  <p className={`text-2xl font-bold ${
                    financialMetrics.taxaPoupanca >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPercentage(financialMetrics.taxaPoupanca)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Liquidez (meses)</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {financialMetrics.liquidez.toFixed(1)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Variabilidade</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatPercentage(financialMetrics.coeficienteVariacao)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Receita vs Despesa por Transação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Receita média por transação</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(financialMetrics.receitaPorTransacao)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Despesa média por transação</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(financialMetrics.despesaPorTransacao)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total de transações</span>
                      <span className="font-semibold text-blue-600">
                        {financialMetrics.totalTransacoes}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total de Receitas</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(financialMetrics.totalReceitas)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total de Despesas</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(financialMetrics.totalDespesas)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Saldo das Contas</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(financialMetrics.totalAccountBalance)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Análise de Sazonalidade */}
        {analysisType === 'seasonality' && (
          <div className="space-y-6">
            <div className="h-[400px]">
              <h3 className="text-lg font-semibold mb-4">Padrão Sazonal de Gastos</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seasonalityAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$ ${value/1000}K`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" strokeWidth={3} />
                  <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={3} />
                  <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#0c6291" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mês com Maior Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const maxIncome = seasonalityAnalysis.reduce((max, month) => 
                      month.receitas > max.receitas ? month : max, seasonalityAnalysis[0] || { receitas: 0, month: 'N/A' }
                    );
                    return (
                      <div>
                        <p className="text-2xl font-bold text-green-600">{maxIncome.month}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(maxIncome.receitas)}</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mês com Maior Despesa</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const maxExpense = seasonalityAnalysis.reduce((max, month) => 
                      month.despesas > max.despesas ? month : max, seasonalityAnalysis[0] || { despesas: 0, month: 'N/A' }
                    );
                    return (
                      <div>
                        <p className="text-2xl font-bold text-red-600">{maxExpense.month}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(maxExpense.despesas)}</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mês com Melhor Saldo</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const maxBalance = seasonalityAnalysis.reduce((max, month) => 
                      month.saldo > max.saldo ? month : max, seasonalityAnalysis[0] || { saldo: 0, month: 'N/A' }
                    );
                    return (
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{maxBalance.month}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(maxBalance.saldo)}</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Padrões de Gastos */}
        {analysisType === 'patterns' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[400px]">
                <h3 className="text-lg font-semibold mb-4">Distribuição por Categoria</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingPatterns}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="total"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {spendingPatterns.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[400px]">
                <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingPatterns} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `R$ ${value/1000}K`} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="total" fill="#0c6291" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Análise Detalhada por Categoria</h3>
              {spendingPatterns.map((category, index) => (
                <Card key={category.name} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <h4 className="font-semibold">{category.name}</h4>
                        <Badge variant="outline">
                          {category.count} transações
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(category.total)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Média: {formatCurrency(category.average)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${(category.total / spendingPatterns[0].total) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        {formatPercentage((category.total / financialMetrics.totalDespesas) * 100)} do total de gastos
                      </span>
                      <span>
                        Última transação: {category.trend.length > 0 ? 
                          new Date(category.trend[category.trend.length - 1].month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedAnalyticsReport;
