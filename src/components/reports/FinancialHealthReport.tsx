import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Heart, Shield, Target, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, Star, Zap } from "lucide-react";
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

const FinancialHealthReport = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading: transactionsLoading } = useSupabaseData('transactions', user?.id);
  const { data: categories, loading: categoriesLoading } = useSupabaseData('categories', user?.id);
  const { data: accounts, loading: accountsLoading } = useSupabaseData('accounts', user?.id);
  const { data: budgets, loading: budgetsLoading } = useSupabaseData('budgets', user?.id);
  const { data: goals, loading: goalsLoading } = useSupabaseData('goals', user?.id);
  
  const { period, customStartDate, customEndDate } = usePeriodFilter();
  const loading = transactionsLoading || categoriesLoading || accountsLoading || budgetsLoading || goalsLoading;

  // Cálculo do Score de Saúde Financeira
  const financialHealthScore = useMemo(() => {
    if (!transactions || !accounts) return { score: 0, details: {} };

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
    const totalDespesas = despesas.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const totalAccountBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

    // 1. Margem de Lucro (0-25 pontos)
    const margemLucro = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0;
    const margemLucroScore = Math.min(25, Math.max(0, margemLucro * 0.25));

    // 2. Liquidez (0-25 pontos)
    const despesaMediaMensal = totalDespesas / 12;
    const mesesLiquidez = despesaMediaMensal > 0 ? totalAccountBalance / despesaMediaMensal : 0;
    const liquidezScore = Math.min(25, Math.max(0, mesesLiquidez * 4.17)); // 6 meses = 25 pontos

    // 3. Estabilidade de Receitas (0-20 pontos)
    const receitasMensais = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthReceitas = receitas
        .filter(t => new Date(t.date).toISOString().slice(0, 7) === monthKey)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      receitasMensais.push(monthReceitas);
    }
    
    const mediaReceitas = receitasMensais.reduce((sum, r) => sum + r, 0) / 12;
    const desvioPadraoReceitas = Math.sqrt(
      receitasMensais.reduce((sum, r) => sum + Math.pow(r - mediaReceitas, 2), 0) / 12
    );
    const coeficienteVariacaoReceitas = mediaReceitas > 0 ? (desvioPadraoReceitas / mediaReceitas) * 100 : 100;
    const estabilidadeScore = Math.max(0, 20 - (coeficienteVariacaoReceitas * 0.2));

    // 4. Diversificação de Gastos (0-15 pontos)
    const gastosPorCategoria = new Map();
    despesas.forEach(transaction => {
      const category = categories?.find(c => c.id === transaction.category_id);
      const categoryName = category?.name || 'Outros';
      const currentAmount = gastosPorCategoria.get(categoryName) || 0;
      gastosPorCategoria.set(categoryName, currentAmount + Number(transaction.amount));
    });

    const totalGastos = Array.from(gastosPorCategoria.values()).reduce((sum, amount) => sum + amount, 0);
    const categorias = Array.from(gastosPorCategoria.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: (amount / totalGastos) * 100
    }));

    // Calcular índice de diversificação (quanto mais categorias, melhor)
    const diversificacaoScore = Math.min(15, categorias.length * 1.5);

    // 5. Controle de Orçamento (0-15 pontos)
    let controleOrcamentoScore = 0;
    if (budgets && budgets.length > 0) {
      const [year, month] = [now.getFullYear(), now.getMonth()];
      const monthTransactions = despesas.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
      });

      const orcamentosRespeitados = budgets.filter(budget => {
        const gasto = monthTransactions
          .filter(t => t.category_id === budget.category_id)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return gasto <= Number(budget.limit_amount);
      }).length;

      controleOrcamentoScore = (orcamentosRespeitados / budgets.length) * 15;
    }

    const scoreTotal = margemLucroScore + liquidezScore + estabilidadeScore + diversificacaoScore + controleOrcamentoScore;

    return {
      score: Math.round(scoreTotal),
      details: {
        margemLucro: { score: margemLucroScore, value: margemLucro },
        liquidez: { score: liquidezScore, value: mesesLiquidez },
        estabilidade: { score: estabilidadeScore, value: coeficienteVariacaoReceitas },
        diversificacao: { score: diversificacaoScore, value: categorias.length },
        controleOrcamento: { score: controleOrcamentoScore, value: budgets?.length || 0 }
      }
    };
  }, [transactions, accounts, categories, budgets, period, customStartDate, customEndDate]);

  // Classificação da Saúde Financeira
  const getHealthLevel = (score: number) => {
    if (score >= 90) return { level: 'Excelente', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-700' };
    if (score >= 75) return { level: 'Muito Boa', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-700' };
    if (score >= 60) return { level: 'Boa', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-700' };
    if (score >= 40) return { level: 'Regular', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-700' };
    return { level: 'Precisa Melhorar', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-700' };
  };

  // Recomendações baseadas no score
  const recommendations = useMemo(() => {
    const recs = [];
    const { score, details } = financialHealthScore;
    const healthLevel = getHealthLevel(score);

    // Recomendações baseadas em cada métrica
    if (details.margemLucro.value < 10) {
      recs.push({
        type: 'warning',
        icon: TrendingUp,
        title: 'Melhore sua Margem de Lucro',
        description: 'Sua margem de lucro está baixa. Considere reduzir gastos desnecessários ou aumentar suas receitas.',
        priority: 'high',
        action: 'Analise seus gastos e identifique oportunidades de economia.'
      });
    }

    if (details.liquidez.value < 3) {
      recs.push({
        type: 'critical',
        icon: Shield,
        title: 'Baixa Liquidez',
        description: `Você tem reserva para apenas ${details.liquidez.value.toFixed(1)} meses. Recomenda-se ter pelo menos 3-6 meses de reserva.`,
        priority: 'high',
        action: 'Construa uma reserva de emergência priorizando economias mensais.'
      });
    }

    if (details.estabilidade.value > 30) {
      recs.push({
        type: 'warning',
        icon: Target,
        title: 'Receitas Instáveis',
        description: 'Suas receitas variam muito mês a mês. Isso pode indicar instabilidade financeira.',
        priority: 'medium',
        action: 'Diversifique suas fontes de renda ou crie um fundo de estabilização.'
      });
    }

    if (details.diversificacao.value < 5) {
      recs.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Diversifique seus Gastos',
        description: 'Você tem poucas categorias de gastos. Diversificar pode ajudar no controle financeiro.',
        priority: 'low',
        action: 'Categorize melhor seus gastos para ter maior controle.'
      });
    }

    if (details.controleOrcamento.value === 0) {
      recs.push({
        type: 'info',
        icon: Target,
        title: 'Crie Orçamentos',
        description: 'Você não tem orçamentos definidos. Orçamentos são essenciais para controle financeiro.',
        priority: 'medium',
        action: 'Defina orçamentos mensais para suas principais categorias de gastos.'
      });
    }

    // Recomendações gerais baseadas no score
    if (score < 40) {
      recs.push({
        type: 'critical',
        icon: AlertTriangle,
        title: 'Ação Imediata Necessária',
        description: 'Sua saúde financeira precisa de atenção urgente. Considere buscar orientação financeira.',
        priority: 'high',
        action: 'Revise completamente seus hábitos financeiros e considere ajuda profissional.'
      });
    } else if (score >= 90) {
      recs.push({
        type: 'positive',
        icon: Star,
        title: 'Parabéns!',
        description: 'Sua saúde financeira está excelente! Continue mantendo esses bons hábitos.',
        priority: 'low',
        action: 'Considere investir ou aumentar suas metas financeiras.'
      });
    }

    return recs;
  }, [financialHealthScore]);

  // Metas e Progresso
  const goalsProgress = useMemo(() => {
    if (!goals) return [];

    return goals.map(goal => {
      const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
      return {
        ...goal,
        progress: Math.min(100, progress),
        remaining: Number(goal.target_amount) - Number(goal.current_amount)
      };
    });
  }, [goals]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando análise de saúde financeira...</div>
        </CardContent>
      </Card>
    );
  }

  const healthLevel = getHealthLevel(financialHealthScore.score);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Saúde Financeira
        </CardTitle>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Score Principal */}
        <div className="mb-8">
          <Card className={`${healthLevel.bgColor} ${healthLevel.borderColor} border-2 dark:border-opacity-50`}>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Heart className={`h-8 w-8 ${healthLevel.color}`} />
                <div>
                  <h2 className="text-3xl font-bold">Score: {financialHealthScore.score}/100</h2>
                  <p className={`text-xl font-semibold ${healthLevel.color}`}>
                    {healthLevel.level}
                  </p>
                </div>
              </div>
              <Progress value={financialHealthScore.score} className="h-3 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Baseado em análise de margem de lucro, liquidez, estabilidade, diversificação e controle de orçamento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detalhamento das Métricas */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Detalhamento das Métricas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Margem de Lucro</span>
                  <Badge variant="outline">{Math.round(financialHealthScore.details.margemLucro.score)}/25</Badge>
                </div>
                <Progress value={financialHealthScore.details.margemLucro.score} className="h-2 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatPercentage(financialHealthScore.details.margemLucro.value)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Liquidez</span>
                  <Badge variant="outline">{Math.round(financialHealthScore.details.liquidez.score)}/25</Badge>
                </div>
                <Progress value={financialHealthScore.details.liquidez.score} className="h-2 mb-2" />
                <p className="text-xs text-gray-500">
                  {financialHealthScore.details.liquidez.value.toFixed(1)} meses de reserva
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Estabilidade</span>
                  <Badge variant="outline">{Math.round(financialHealthScore.details.estabilidade.score)}/20</Badge>
                </div>
                <Progress value={financialHealthScore.details.estabilidade.score} className="h-2 mb-2" />
                <p className="text-xs text-gray-500">
                  {formatPercentage(financialHealthScore.details.estabilidade.value)} de variação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Diversificação</span>
                  <Badge variant="outline">{Math.round(financialHealthScore.details.diversificacao.score)}/15</Badge>
                </div>
                <Progress value={financialHealthScore.details.diversificacao.score} className="h-2 mb-2" />
                <p className="text-xs text-gray-500">
                  {financialHealthScore.details.diversificacao.value} categorias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Controle Orçamento</span>
                  <Badge variant="outline">{Math.round(financialHealthScore.details.controleOrcamento.score)}/15</Badge>
                </div>
                <Progress value={financialHealthScore.details.controleOrcamento.score} className="h-2 mb-2" />
                <p className="text-xs text-gray-500">
                  {financialHealthScore.details.controleOrcamento.value} orçamentos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recomendações */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recomendações Personalizadas
            </h3>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className={`border-l-4 ${
                  rec.type === 'positive' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' :
                  rec.type === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
                  rec.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <rec.icon className={`h-5 w-5 mt-0.5 ${
                        rec.type === 'positive' ? 'text-green-600 dark:text-green-400' :
                        rec.type === 'critical' ? 'text-red-600 dark:text-red-400' :
                        rec.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">{rec.title}</h4>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'default'} className="text-xs">
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{rec.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">💡 {rec.action}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Progresso das Metas */}
        {goalsProgress.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progresso das Metas
            </h3>
            <div className="space-y-4">
              {goalsProgress.map((goal, index) => (
                <Card key={goal.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{goal.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                      </div>
                      <Badge variant={goal.progress >= 100 ? 'default' : 'secondary'}>
                        {goal.progress.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <Progress value={goal.progress} className="h-2 mb-3" />
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Restam: {formatCurrency(goal.remaining)}
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

export default FinancialHealthReport;
