
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useMemo } from "react";
import { usePeriodFilter } from "@/pages/Reports";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const CashFlowReport = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading } = useSupabaseData('transactions', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { period, customStartDate, customEndDate } = usePeriodFilter();

  const chartData = useMemo(() => {
    if (!transactions || !accounts) return [];

    const now = new Date();
    let months = 1;

    // Calcular período baseado no filtro global
    if (period === "custom" && customStartDate && customEndDate) {
      // Para período personalizado, calcular diferença em meses
      const diffTime = Math.abs(customEndDate.getTime() - customStartDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      months = Math.max(1, Math.ceil(diffDays / 30)); // Aproximação de meses
    } else {
      switch (period) {
        case "current-month":
          months = 1;
          break;
        case "last-month":
          months = 1;
          break;
        case "last-3-months":
          months = 3;
          break;
        case "last-6-months":
          months = 6;
          break;
        case "last-12-months":
          months = 12;
          break;
        case "current-year":
          months = 12;
          break;
        case "last-year":
          months = 12;
          break;
        default:
          months = 1;
      }
    }
    
    let runningBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    
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

        const entradas = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const saidas = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const saldoLiquido = entradas - saidas;
        runningBalance += saldoLiquido;

        monthsData.push({
          month: monthName,
          entradas,
          saidas,
          saldoLiquido,
          saldoAcumulado: runningBalance
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
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        
        const monthTransactions = transactions.filter(t => {
          const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
          return transactionMonth === monthKey;
        });

        const entradas = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const saidas = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const saldoLiquido = entradas - saidas;
        runningBalance += saldoLiquido;

        monthsData.push({
          month: monthName,
          entradas,
          saidas,
          saldoLiquido,
          saldoAcumulado: runningBalance
        });
      }
    }

    return monthsData;
  }, [transactions, accounts, period, customStartDate, customEndDate]);

  const summary = useMemo(() => {
    const totalEntradas = chartData.reduce((sum, item) => sum + item.entradas, 0);
    const totalSaidas = chartData.reduce((sum, item) => sum + item.saidas, 0);
    const saldoFinal = chartData.length > 0 ? chartData[chartData.length - 1].saldoAcumulado : 0;
    const saldoInicial = chartData.length > 0 ? chartData[0].saldoAcumulado - chartData[0].saldoLiquido : 0;
    const variacaoTotal = saldoFinal - saldoInicial;

    return { totalEntradas, totalSaidas, saldoFinal, saldoInicial, variacaoTotal };
  }, [chartData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando relatório de fluxo de caixa...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Fluxo de Caixa</CardTitle>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[400px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `R$ ${value/1000}K`} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend />
              <Area type="monotone" dataKey="saldoAcumulado" name="Saldo Acumulado" stroke="#0c6291" fill="#0c6291" fillOpacity={0.3} />
              <Line type="monotone" dataKey="saldoLiquido" name="Fluxo Líquido" stroke="#22c55e" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Total de Entradas</p>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalEntradas)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Total de Saídas</p>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalSaidas)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-4 flex flex-col items-center">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Saldo Atual</p>
              <p className={`text-2xl font-bold ${
                summary.saldoFinal >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
              }`}>
                {formatCurrency(summary.saldoFinal)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 flex flex-col items-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Variação no Período</p>
              <p className={`text-2xl font-bold ${
                summary.variacaoTotal >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}>
                {formatCurrency(summary.variacaoTotal)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detalhamento Mensal</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-2">Mês</th>
                  <th className="text-right p-2">Entradas</th>
                  <th className="text-right p-2">Saídas</th>
                  <th className="text-right p-2">Fluxo Líquido</th>
                  <th className="text-right p-2">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => (
                  <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 font-medium">{item.month}</td>
                    <td className="p-2 text-right text-green-600 dark:text-green-400">{formatCurrency(item.entradas)}</td>
                    <td className="p-2 text-right text-red-600 dark:text-red-400">{formatCurrency(item.saidas)}</td>
                    <td className={`p-2 text-right font-medium ${
                      item.saldoLiquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(item.saldoLiquido)}
                    </td>
                    <td className={`p-2 text-right font-medium ${
                      item.saldoAcumulado >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(item.saldoAcumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowReport;
