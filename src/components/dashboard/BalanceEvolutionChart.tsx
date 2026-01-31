import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialPeriod } from "@/hooks/useFinancialPeriod";
import { PeriodType } from "@/components/dashboard/PeriodFilter";
import { useTheme } from "@/hooks/useTheme";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type BalanceEvolutionChartProps = {
  selectedPeriod?: PeriodType;
  customDateRange?: { from?: Date; to?: Date };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const BalanceEvolutionChart = ({ selectedPeriod = 'current-month', customDateRange }: BalanceEvolutionChartProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { filterTransactionsByPeriod, getFinancialPeriod } = useFinancialPeriod();
  const { data: transactions } = useSupabaseData('transactions', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const chartData = useMemo(() => {
    if (!transactions || !accounts) return [];

    // Determinar período
    const period = (selectedPeriod === 'custom' && customDateRange?.from && customDateRange?.to)
      ? { startDate: customDateRange.from, endDate: customDateRange.to }
      : getFinancialPeriod(selectedPeriod);

    // Saldo inicial das contas
    const initialBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);

    // Ordenar transações por data
    const sortedTransactions = [...transactions]
      .filter(t => {
        const [year, month, day] = t.date.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d <= period.endDate;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calcular saldo acumulado por dia no período
    const dailyBalances: { date: string; balance: number; label: string }[] = [];
    let runningBalance = initialBalance;

    // Processar transações anteriores ao período para ter o saldo inicial correto
    sortedTransactions.forEach(t => {
      const [year, month, day] = t.date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      
      if (d < period.startDate) {
        if (t.type === 'income') {
          runningBalance += Math.abs(Number(t.amount));
        } else if (t.type === 'expense') {
          runningBalance -= Math.abs(Number(t.amount));
        }
      }
    });

    // Gerar pontos de dados para o período
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determinar intervalo de dias baseado no período
    const interval = dayDiff <= 31 ? 1 : dayDiff <= 90 ? 3 : 7;

    for (let i = 0; i <= dayDiff; i += interval) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      if (currentDate > endDate) break;

      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Adicionar transações do dia
      const dayTransactions = sortedTransactions.filter(t => {
        const [year, month, day] = t.date.split('-').map(Number);
        const tDate = new Date(year, month - 1, day);
        return tDate.toISOString().split('T')[0] === dateStr && tDate >= period.startDate;
      });

      dayTransactions.forEach(t => {
        if (t.type === 'income') {
          runningBalance += Math.abs(Number(t.amount));
        } else if (t.type === 'expense') {
          runningBalance -= Math.abs(Number(t.amount));
        }
      });

      dailyBalances.push({
        date: dateStr,
        balance: runningBalance,
        label: currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      });
    }

    return dailyBalances;
  }, [transactions, accounts, selectedPeriod, customDateRange, getFinancialPeriod]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-card p-3 shadow-lg rounded-lg border border-border">
          <p className="font-medium text-card-foreground text-sm">{label}</p>
          <p className="text-primary font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Calcular variação
  const firstBalance = chartData.length > 0 ? chartData[0].balance : 0;
  const lastBalance = chartData.length > 0 ? chartData[chartData.length - 1].balance : 0;
  const variation = lastBalance - firstBalance;
  const variationPercent = firstBalance !== 0 ? (variation / Math.abs(firstBalance)) * 100 : 0;

  const getVariationIcon = () => {
    if (variation > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (variation < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getVariationColor = () => {
    if (variation > 0) return "text-green-500";
    if (variation < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-card-foreground">Evolução do Saldo</CardTitle>
          <CardDescription>Acompanhe a evolução do seu patrimônio</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-center text-muted-foreground">
            <p>Nenhum dado disponível</p>
            <p className="text-sm mt-2">Adicione transações para ver o gráfico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-card-foreground">Evolução do Saldo</CardTitle>
            <CardDescription>Acompanhe a evolução do seu patrimônio</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getVariationIcon()}
            <span className={`text-sm font-medium ${getVariationColor()}`}>
              {variation >= 0 ? '+' : ''}{formatCurrency(variation)} ({variationPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'hsl(var(--border))' : '#e5e7eb'} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: isDark ? 'hsl(var(--muted-foreground))' : '#6b7280' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: isDark ? 'hsl(var(--muted-foreground))' : '#6b7280' }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#balanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceEvolutionChart;
