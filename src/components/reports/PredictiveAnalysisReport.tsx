import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Brain, Calendar, Zap } from "lucide-react";
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

const PredictiveAnalysisReport = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading: transactionsLoading } = useSupabaseData('transactions', user?.id);
  const { data: categories, loading: categoriesLoading } = useSupabaseData('categories', user?.id);
  const { data: accounts, loading: accountsLoading } = useSupabaseData('accounts', user?.id);
  
  const { period, customStartDate, customEndDate } = usePeriodFilter();
  const [predictionType, setPredictionType] = useState("income-expense");

  const loading = transactionsLoading || categoriesLoading || accountsLoading;

  // Função para calcular média móvel
  const calculateMovingAverage = (data: number[], window: number) => {
    const result = [];
    for (let i = window - 1; i < data.length; i++) {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
    return result;
  };

  // Função para calcular tendência linear simples
  const calculateLinearTrend = (data: number[]) => {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  };

  // Dados históricos para análise
  const historicalData = useMemo(() => {
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
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      }
    }

    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Agrupar por mês dentro do período
    const monthsData = [];
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

      monthsData.push({
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

    return monthsData;
  }, [transactions, period, customStartDate, customEndDate]);

  // Projeções futuras
  const predictions = useMemo(() => {
    if (historicalData.length < 3) return [];

    const receitas = historicalData.map(d => d.receitas);
    const despesas = historicalData.map(d => d.despesas);
    const saldos = historicalData.map(d => d.saldo);

    // Calcular tendências
    const receitasTrend = calculateLinearTrend(receitas);
    const despesasTrend = calculateLinearTrend(despesas);
    const saldosTrend = calculateLinearTrend(saldos);

    // Calcular médias móveis
    const receitasMA = calculateMovingAverage(receitas, 3);
    const despesasMA = calculateMovingAverage(despesas, 3);
    const saldosMA = calculateMovingAverage(saldos, 3);

    // Gerar projeções para os próximos 6 meses
    const predictions = [];
    const baseIndex = historicalData.length;

    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const monthName = futureDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      // Projeção otimista (tendência + 10%)
      const receitaOtimista = Math.max(0, receitasTrend.slope * (baseIndex + i - 1) + receitasTrend.intercept * 1.1);
      const despesaOtimista = Math.max(0, despesasTrend.slope * (baseIndex + i - 1) + despesasTrend.intercept * 0.9);
      
      // Projeção pessimista (tendência - 10%)
      const receitaPessimista = Math.max(0, receitasTrend.slope * (baseIndex + i - 1) + receitasTrend.intercept * 0.9);
      const despesaPessimista = Math.max(0, despesasTrend.slope * (baseIndex + i - 1) + despesasTrend.intercept * 1.1);
      
      // Projeção realista (média móvel)
      const receitaRealista = receitasMA.length > 0 ? receitasMA[receitasMA.length - 1] : receitas[receitas.length - 1];
      const despesaRealista = despesasMA.length > 0 ? despesasMA[despesasMA.length - 1] : despesas[despesas.length - 1];

      predictions.push({
        month: monthName,
        receitaOtimista,
        receitaRealista,
        receitaPessimista,
        despesaOtimista,
        despesaRealista,
        despesaPessimista,
        saldoOtimista: receitaOtimista - despesaOtimista,
        saldoRealista: receitaRealista - despesaRealista,
        saldoPessimista: receitaPessimista - despesaPessimista
      });
    }

    return predictions;
  }, [historicalData]);

  // Análise de cenários
  const scenarioAnalysis = useMemo(() => {
    if (predictions.length === 0) return {};

    const totalReceitasOtimista = predictions.reduce((sum, p) => sum + p.receitaOtimista, 0);
    const totalReceitasRealista = predictions.reduce((sum, p) => sum + p.receitaRealista, 0);
    const totalReceitasPessimista = predictions.reduce((sum, p) => sum + p.receitaPessimista, 0);

    const totalDespesasOtimista = predictions.reduce((sum, p) => sum + p.despesaOtimista, 0);
    const totalDespesasRealista = predictions.reduce((sum, p) => sum + p.despesaRealista, 0);
    const totalDespesasPessimista = predictions.reduce((sum, p) => sum + p.despesaPessimista, 0);

    const saldoOtimista = totalReceitasOtimista - totalDespesasOtimista;
    const saldoRealista = totalReceitasRealista - totalDespesasRealista;
    const saldoPessimista = totalReceitasPessimista - totalDespesasPessimista;

    return {
      otimista: { receitas: totalReceitasOtimista, despesas: totalDespesasOtimista, saldo: saldoOtimista },
      realista: { receitas: totalReceitasRealista, despesas: totalDespesasRealista, saldo: saldoRealista },
      pessimista: { receitas: totalReceitasPessimista, despesas: totalDespesasPessimista, saldo: saldoPessimista }
    };
  }, [predictions]);

  // Recomendações baseadas nas projeções
  const recommendations = useMemo(() => {
    const recommendations = [];

    if (scenarioAnalysis.realista?.saldo < 0) {
      recommendations.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Projeção de Saldo Negativo',
        description: 'Baseado nas tendências atuais, você pode ter saldo negativo nos próximos 6 meses. Considere reduzir gastos ou aumentar receitas.',
        priority: 'high'
      });
    }

    if (scenarioAnalysis.pessimista?.saldo < scenarioAnalysis.realista?.saldo * 0.5) {
      recommendations.push({
        type: 'info',
        icon: Target,
        title: 'Preparação para Cenário Pessimista',
        description: 'No cenário pessimista, seu saldo seria significativamente menor. Mantenha uma reserva de emergência.',
        priority: 'medium'
      });
    }

    if (scenarioAnalysis.otimista?.saldo > scenarioAnalysis.realista?.saldo * 1.5) {
      recommendations.push({
        type: 'positive',
        icon: CheckCircle,
        title: 'Oportunidade de Crescimento',
        description: 'No cenário otimista, você teria um saldo muito positivo. Considere investir ou aumentar suas metas.',
        priority: 'low'
      });
    }

    // Análise de tendência de receitas
    const receitasTrend = historicalData.length > 1 ? 
      ((historicalData[historicalData.length - 1].receitas - historicalData[0].receitas) / Math.max(historicalData[0].receitas, 1)) * 100 : 0;

    if (receitasTrend < -10) {
      recommendations.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Declínio nas Receitas',
        description: `Suas receitas diminuíram ${Math.abs(receitasTrend).toFixed(1)}% no período. Analise as causas e tome ações corretivas.`,
        priority: 'high'
      });
    }

    return recommendations;
  }, [scenarioAnalysis, historicalData]);

  // Dados combinados (histórico + projeções)
  const combinedData = useMemo(() => {
    const combined = [...historicalData];
    
    predictions.forEach(prediction => {
      combined.push({
        month: prediction.month,
        receitas: prediction.receitaRealista,
        despesas: prediction.despesaRealista,
        saldo: prediction.saldoRealista,
        transacoes: 0, // Projeções não têm transações
        isProjection: true
      });
    });

    return combined;
  }, [historicalData, predictions]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando análise preditiva...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Análise Preditiva
        </CardTitle>
        <div className="flex gap-2">
          <Select value={predictionType} onValueChange={setPredictionType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Projeção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income-expense">Receitas vs Despesas</SelectItem>
              <SelectItem value="scenarios">Cenários</SelectItem>
              <SelectItem value="trends">Tendências</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Recomendações */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recomendações Inteligentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className={`border-l-4 ${
                  rec.type === 'positive' ? 'border-l-green-500 bg-green-50' :
                  rec.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <rec.icon className={`h-5 w-5 mt-0.5 ${
                        rec.type === 'positive' ? 'text-green-600' :
                        rec.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">{rec.title}</h4>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'default'} className="text-xs">
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Análise de Cenários */}
        {predictionType === 'scenarios' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Análise de Cenários (Próximos 6 Meses)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Cenário Otimista
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Receitas:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(scenarioAnalysis.otimista?.receitas || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Despesas:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(scenarioAnalysis.otimista?.despesas || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Saldo:</span>
                    <span className={`font-bold ${
                      (scenarioAnalysis.otimista?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(scenarioAnalysis.otimista?.saldo || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Cenário Realista
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Receitas:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(scenarioAnalysis.realista?.receitas || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Despesas:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(scenarioAnalysis.realista?.despesas || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Saldo:</span>
                    <span className={`font-bold ${
                      (scenarioAnalysis.realista?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(scenarioAnalysis.realista?.saldo || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Cenário Pessimista
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Receitas:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(scenarioAnalysis.pessimista?.receitas || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Despesas:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(scenarioAnalysis.pessimista?.despesas || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Saldo:</span>
                    <span className={`font-bold ${
                      (scenarioAnalysis.pessimista?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(scenarioAnalysis.pessimista?.saldo || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Gráfico de Projeções */}
        {predictionType === 'income-expense' && (
          <div className="h-[500px] mb-6">
            <h3 className="text-lg font-semibold mb-4">Projeções de Receitas vs Despesas</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${value/1000}K`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="receitas" 
                  name="Receitas" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6} 
                />
                <Area 
                  type="monotone" 
                  dataKey="despesas" 
                  name="Despesas" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6} 
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  name="Saldo Líquido" 
                  stroke="#0c6291" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600">
              <p>• Linha sólida: Dados históricos</p>
              <p>• Linha tracejada: Projeções baseadas em tendências</p>
            </div>
          </div>
        )}

        {/* Gráfico de Tendências */}
        {predictionType === 'trends' && (
          <div className="space-y-6">
            <div className="h-[400px]">
              <h3 className="text-lg font-semibold mb-4">Tendências e Projeções</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$ ${value/1000}K`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="receitas" 
                    name="Receitas" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="despesas" 
                    name="Despesas" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Projeções Mensais Detalhadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.slice(0, 3).map((pred, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{pred.month}</span>
                          <Badge variant="outline">Projeção</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Receitas:</span>
                            <span className="ml-2 font-semibold text-green-600">
                              {formatCurrency(pred.receitaRealista)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Despesas:</span>
                            <span className="ml-2 font-semibold text-red-600">
                              {formatCurrency(pred.despesaRealista)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-gray-600">Saldo:</span>
                          <span className={`ml-2 font-bold ${
                            pred.saldoRealista >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(pred.saldoRealista)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo das Projeções</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total de Receitas (6 meses)</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(scenarioAnalysis.realista?.receitas || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total de Despesas (6 meses)</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(scenarioAnalysis.realista?.despesas || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium">Saldo Total Projetado</span>
                      <span className={`font-bold ${
                        (scenarioAnalysis.realista?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(scenarioAnalysis.realista?.saldo || 0)}
                      </span>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> As projeções são baseadas em tendências históricas e podem variar 
                        conforme mudanças no comportamento financeiro.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalysisReport;
