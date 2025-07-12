
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Wallet, CreditCard, PiggyBank } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useMemo } from "react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const COLORS = ["#0c6291", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const AccountBalanceReport = () => {
  const { user } = useSupabaseAuth();
  const { data: accounts, loading: accountsLoading } = useSupabaseData('accounts', user?.id);
  const { data: cards, loading: cardsLoading } = useSupabaseData('cards', user?.id);

  const loading = accountsLoading || cardsLoading;

  const accountsData = useMemo(() => {
    if (!accounts) return [];
    
    return accounts.map(account => ({
      ...account,
      balance: Number(account.balance || 0)
    })).sort((a, b) => b.balance - a.balance);
  }, [accounts]);

  const cardsData = useMemo(() => {
    if (!cards) return [];
    
    return cards.map(card => ({
      ...card,
      available: Number(card.credit_limit) - Number(card.used_amount || 0),
      used: Number(card.used_amount || 0),
      limit: Number(card.credit_limit)
    }));
  }, [cards]);

  const pieChartData = useMemo(() => {
    return accountsData.map((account, index) => ({
      name: account.name,
      value: account.balance,
      color: COLORS[index % COLORS.length]
    })).filter(item => item.value > 0);
  }, [accountsData]);

  const summary = useMemo(() => {
    const totalBalance = accountsData.reduce((sum, account) => sum + account.balance, 0);
    const totalCreditLimit = cardsData.reduce((sum, card) => sum + card.limit, 0);
    const totalCreditUsed = cardsData.reduce((sum, card) => sum + card.used, 0);
    const totalCreditAvailable = totalCreditLimit - totalCreditUsed;
    const positiveAccounts = accountsData.filter(acc => acc.balance > 0).length;
    const negativeAccounts = accountsData.filter(acc => acc.balance < 0).length;

    return { 
      totalBalance, 
      totalCreditLimit, 
      totalCreditUsed, 
      totalCreditAvailable, 
      positiveAccounts, 
      negativeAccounts 
    };
  }, [accountsData, cardsData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando relatório de saldos das contas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Saldo das Contas e Cartões</CardTitle>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-700">Saldo Total</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalBalance)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">Crédito Disponível</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCreditAvailable)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700">Crédito Utilizado</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalCreditUsed)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 flex items-center gap-3">
              <PiggyBank className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-700">Patrimônio Líquido</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(summary.totalBalance - summary.totalCreditUsed)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Pizza - Distribuição dos Saldos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição dos Saldos</CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma conta com saldo positivo
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Utilização dos Cartões */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Utilização dos Cartões</CardTitle>
            </CardHeader>
            <CardContent>
              {cardsData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cardsData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `R$ ${value/1000}K`} />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="used" name="Utilizado" fill="#ef4444" />
                      <Bar dataKey="available" name="Disponível" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum cartão cadastrado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada das Contas */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Detalhamento das Contas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Conta</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-left p-3">Banco</th>
                    <th className="text-right p-3">Saldo</th>
                    <th className="text-center p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsData.map((account) => (
                    <tr key={account.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{account.name}</td>
                      <td className="p-3 capitalize">{account.type}</td>
                      <td className="p-3">{account.bank || '-'}</td>
                      <td className={`p-3 text-right font-medium ${
                        account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(account.balance)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          account.balance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {account.balance >= 0 ? 'Positivo' : 'Negativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela Detalhada dos Cartões */}
          {cardsData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Detalhamento dos Cartões</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Cartão</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-right p-3">Limite</th>
                      <th className="text-right p-3">Utilizado</th>
                      <th className="text-right p-3">Disponível</th>
                      <th className="text-center p-3">Utilização</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cardsData.map((card) => {
                      const utilizationPercent = (card.used / card.limit) * 100;
                      return (
                        <tr key={card.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{card.name}</td>
                          <td className="p-3 capitalize">{card.type}</td>
                          <td className="p-3 text-right">{formatCurrency(card.limit)}</td>
                          <td className="p-3 text-right text-red-600">{formatCurrency(card.used)}</td>
                          <td className="p-3 text-right text-green-600">{formatCurrency(card.available)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              utilizationPercent > 80 ? 'bg-red-100 text-red-800' :
                              utilizationPercent > 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {utilizationPercent.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountBalanceReport;
