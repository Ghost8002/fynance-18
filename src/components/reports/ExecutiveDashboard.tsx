import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Brain, 
  Calculator, 
  PieChart as PieChartIcon,
  DollarSign,
  CreditCard,
  Calendar,
  Activity,
  Zap,
  Star
} from "lucide-react";
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

const ExecutiveDashboard = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading: transactionsLoading } = useSupabaseData('transactions', user?.id);
  const { data: categories, loading: categoriesLoading } = useSupabaseData('categories', user?.id);
  const { data: accounts, loading: accountsLoading } = useSupabaseData('accounts', user?.id);
  const { data: budgets, loading: budgetsLoading } = useSupabaseData('budgets', user?.id);
  const { data: goals, loading: goalsLoading } = useSupabaseData('goals', user?.id);
  
  const { period, customStartDate, customEndDate } = usePeriodFilter();
  const [view, setView] = useState("overview");

  const loading = transactionsLoading || categoriesLoading || accountsLoading || budgetsLoading || goalsLoading;

  // KPIs Principais
  const kpis = useMemo(() => {
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
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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
    const saldoLiquido = totalReceitas - totalDespesas;
    const totalAccountBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

    // Comparação com período anterior
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(endDate);
    const periodLength = endDate.getTime() - startDate.getTime();
    
    previousStartDate.setTime(previousStartDate.getTime() - periodLength);
    previousEndDate.setTime(previousEndDate.getTime() - periodLength);

    const previousTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= previousStartDate && transactionDate <= previousEndDate;
    });

    const previousReceitas = previousTransactions.filter(t => t.type === 'income');
    const previousDespesas = previousTransactions.filter(t => t.type === 'expense');
    const previousTotalReceitas = previousReceitas.reduce((sum, t) => sum + Number(t.amount), 0);
    const previousTotalDespesas = previousDespesas.reduce((sum, t) => sum + Number(t.amount), 0);

    const variacaoReceitas = previousTotalReceitas > 0 ? 
      ((totalReceitas - previousTotalReceitas) / previousTotalReceitas) * 100 : 0;
    const variacaoDespesas = previousTotalDespesas > 0 ? 
      ((totalDespesas - previousTotalDespesas) / previousTotalDespesas) * 100 : 0;

    // Margem de lucro
    const margemLucro = totalReceitas > 0 ? (saldoLiquido / totalReceitas) * 100 : 0;

    // Liquidez
    const despesaMediaMensal = totalDespesas / (period === "current-month" ? 1 : 
      period === "last-month" ? 1 : 
      period === "last-3-months" ? 3 : 6);
    const mesesLiquidez = despesaMediaMensal > 0 ? totalAccountBalance / despesaMediaMensal : 0;

    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido,
      totalAccountBalance,
      variacaoReceitas,
      variacaoDespesas,
      margemLucro,
      mesesLiquidez,
      totalTransacoes: periodTransactions.length
    };
  }, [transactions, accounts, period, customStartDate, customEndDate]);

  // Dados para gráficos
  const chartData = useMemo(() => {
    if (!transactions) return [];

    const now = new Date();
    let months = 1;
    
    // Calcular número de meses baseado no período
    if (period === "custom" && customStartDate && customEndDate) {
      const diffTime = Math.abs(customEndDate.getTime() - customStartDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      months = Math.max(1, Math.ceil(diffDays / 30));
    } else {
      months = period === "current-month" ? 1 : 
                period === "last-month" ? 1 : 
                period === "last-3-months" ? 3 : 
                period === "last-6-months" ? 6 :
                period === "last-12-months" ? 12 :
                period === "current-year" ? 12 :
                period === "last-year" ? 12 : 1;
    }
    
    const monthsData = [];
    
    if (period === "custom" && customStartDate && customEndDate) {
      // Para período personalizado, agrupar por mês dentro do período
      const currentDate = new Date(customStartDate);
      const endDateCopy = new Date(customEndDate);
      
      while (currentDate <= endDateCopy) {
        const monthKey = currentDate.toISOString().slice(0, 7);
        const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          const transactionMonth = transactionDate.toISOString().slice(0, 7);
          return transactionMonth === monthKey && 
                 transactionDate >= customStartDate && 
                 transactionDate <= customEndDate;
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
          saldo: receitas - despesas
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
          saldo: receitas - despesas
        });
      }
    }

    return monthsData;
  }, [transactions, period, customStartDate, customEndDate]);

  // Top categorias de gastos
  const topCategories = useMemo(() => {
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

    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate && t.type === 'expense';
    });

    const categoryTotals = new Map();
    periodTransactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.category_id);
      const categoryName = category?.name || 'Sem categoria';
      const currentAmount = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, currentAmount + Number(transaction.amount));
    });

    return Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions, categories, period, customStartDate, customEndDate]);

  // Análise de orçamentos
  const budgetAnalysis = useMemo(() => {
    if (!budgets || !transactions) return {};

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear &&
             t.type === 'expense';
    });

    const budgetStatus = budgets.map(budget => {
      const spent = monthTransactions
        .filter(t => t.category_id === budget.category_id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const percentage = (spent / Number(budget.limit_amount)) * 100;
      const remaining = Number(budget.limit_amount) - spent;
      
      return {
        ...budget,
        spent,
        percentage: Math.round(percentage),
        remaining,
        status: percentage > 100 ? 'exceeded' : percentage > 80 ? 'warning' : 'good'
      };
    });

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.limit_amount), 0);
    const totalSpent = budgetStatus.reduce((sum, b) => sum + b.spent, 0);
    const budgetUtilization = (totalSpent / totalBudget) * 100;

    return {
      budgetStatus,
      totalBudget,
      totalSpent,
      budgetUtilization,
      overBudgetCount: budgetStatus.filter(b => b.status === 'exceeded').length,
      warningCount: budgetStatus.filter(b => b.status === 'warning').length
    };
  }, [budgets, transactions]);

  // Progresso das metas
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

  // Alertas importantes
  const alerts = useMemo(() => {
    const alertsList = [];

    // Alerta de saldo negativo
    if (kpis.saldoLiquido < 0) {
      alertsList.push({
        type: 'critical',
        icon: AlertTriangle,
        title: 'Saldo Negativo',
        message: `Seu saldo líquido é negativo: ${formatCurrency(kpis.saldoLiquido)}`,
        priority: 'high'
      });
    }

    // Alerta de baixa liquidez
    if (kpis.mesesLiquidez < 3) {
      alertsList.push({
        type: 'warning',
        icon: CreditCard,
        title: 'Baixa Liquidez',
        message: `Você tem reserva para apenas ${kpis.mesesLiquidez.toFixed(1)} meses`,
        priority: 'high'
      });
    }

    // Alerta de orçamento excedido
    if (budgetAnalysis.overBudgetCount > 0) {
      alertsList.push({
        type: 'warning',
        icon: Target,
        title: 'Orçamentos Excedidos',
        message: `${budgetAnalysis.overBudgetCount} categoria(s) excederam o orçamento`,
        priority: 'medium'
      });
    }

    // Alerta de margem de lucro baixa
    if (kpis.margemLucro < 10) {
      alertsList.push({
        type: 'info',
        icon: TrendingDown,
        title: 'Margem de Lucro Baixa',
        message: `Sua margem de lucro é de apenas ${formatPercentage(kpis.margemLucro)}`,
        priority: 'medium'
      });
    }

    return alertsList;
  }, [kpis, budgetAnalysis]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando dashboard executivo...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Dashboard Executivo
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Alertas Importantes */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((alert, index) => (
                <Card key={index} className={`border-l-4 ${
                  alert.type === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
                  alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <alert.icon className={`h-5 w-5 ${
                        alert.type === 'critical' ? 'text-red-600 dark:text-red-400' :
                        alert.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                            {alert.priority === 'high' ? 'Alta' : 'Média'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{alert.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* KPIs Principais */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            KPIs Principais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Receitas</p>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(kpis.totalReceitas)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {kpis.variacaoReceitas >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 dark:text-red-400" />
                  )}
                  <span className={`text-xs ${
                    kpis.variacaoReceitas >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPercentage(Math.abs(kpis.variacaoReceitas))}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Total Despesas</p>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(kpis.totalDespesas)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {kpis.variacaoDespesas <= 0 ? (
                    <TrendingDown className="h-3 w-3 text-green-500 dark:text-green-400" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-red-500 dark:text-red-400" />
                  )}
                  <span className={`text-xs ${
                    kpis.variacaoDespesas <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPercentage(Math.abs(kpis.variacaoDespesas))}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Saldo Líquido</p>
                </div>
                <p className={`text-2xl font-bold ${
                  kpis.saldoLiquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(kpis.saldoLiquido)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Margem: {formatPercentage(kpis.margemLucro)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Saldo Total</p>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(kpis.totalAccountBalance)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Liquidez: {kpis.mesesLiquidez.toFixed(1)} meses
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendência de Receitas vs Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$ ${value/1000}K`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Mês: ${label}`}
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--foreground)'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 5 Categorias de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCategories} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `R$ ${value/1000}K`} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--foreground)'
                      }}
                    />
                    <Bar dataKey="value" fill="#0c6291" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Análise de Orçamentos e Metas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Status dos Orçamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Utilização Geral</span>
                  <span className="font-semibold">{formatPercentage(budgetAnalysis.budgetUtilization || 0)}</span>
                </div>
                <Progress value={budgetAnalysis.budgetUtilization || 0} className="h-2" />
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{budgetAnalysis.budgetStatus?.filter(b => b.status === 'good').length || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Dentro do Orçamento</p>
                  </div>
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{budgetAnalysis.warningCount || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Atenção</p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{budgetAnalysis.overBudgetCount || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Excedido</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" />
                Progresso das Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {goalsProgress.slice(0, 3).map((goal, index) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{goal.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{goal.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatCurrency(Number(goal.current_amount))}</span>
                      <span>{formatCurrency(Number(goal.target_amount))}</span>
                    </div>
                  </div>
                ))}
                {goalsProgress.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Nenhuma meta definida
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutiveDashboard;
