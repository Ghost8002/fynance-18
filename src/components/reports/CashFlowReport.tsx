
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState, useMemo } from "react";

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
  const [period, setPeriod] = useState("6months");

  const chartData = useMemo(() => {
    if (!transactions || !accounts) return [];

    const now = new Date();
    const months = period === "3months" ? 3 : period === "6months" ? 6 : 12;
    
    let runningBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    
    const monthsData = [];
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

    return monthsData;
  }, [transactions, accounts, period]);

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
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione um período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
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
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-700">Total de Entradas</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalEntradas)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-700">Total de Saídas</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalSaidas)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex flex-col items-center">
              <p className="text-sm font-medium text-blue-700 mb-2">Saldo Atual</p>
              <p className={`text-2xl font-bold ${
                summary.saldoFinal >= 0 ? "text-blue-600" : "text-red-600"
              }`}>
                {formatCurrency(summary.saldoFinal)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4 flex flex-col items-center">
              <p className="text-sm font-medium text-gray-700 mb-2">Variação no Período</p>
              <p className={`text-2xl font-bold ${
                summary.variacaoTotal >= 0 ? "text-green-600" : "text-red-600"
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
                <tr className="border-b">
                  <th className="text-left p-2">Mês</th>
                  <th className="text-right p-2">Entradas</th>
                  <th className="text-right p-2">Saídas</th>
                  <th className="text-right p-2">Fluxo Líquido</th>
                  <th className="text-right p-2">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{item.month}</td>
                    <td className="p-2 text-right text-green-600">{formatCurrency(item.entradas)}</td>
                    <td className="p-2 text-right text-red-600">{formatCurrency(item.saidas)}</td>
                    <td className={`p-2 text-right font-medium ${
                      item.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.saldoLiquido)}
                    </td>
                    <td className={`p-2 text-right font-medium ${
                      item.saldoAcumulado >= 0 ? 'text-blue-600' : 'text-red-600'
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
