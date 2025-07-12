
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState, useMemo } from "react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const BudgetAnalysisReport = () => {
  const { user } = useSupabaseAuth();
  const { data: budgets, loading: budgetsLoading } = useSupabaseData('budgets', user?.id);
  const { data: categories, loading: categoriesLoading } = useSupabaseData('categories', user?.id);
  const { data: transactions, loading: transactionsLoading } = useSupabaseData('transactions', user?.id);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const loading = budgetsLoading || categoriesLoading || transactionsLoading;

  const budgetAnalysis = useMemo(() => {
    if (!budgets || !categories || !transactions) return [];

    const [year, month] = selectedMonth.split('-').map(Number);
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === month - 1 && 
             transactionDate.getFullYear() === year &&
             t.type === 'expense';
    });

    return budgets.map(budget => {
      const category = categories.find(c => c.id === budget.category_id);
      const spent = monthTransactions
        .filter(t => t.category_id === budget.category_id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const percentage = (spent / Number(budget.limit_amount)) * 100;
      const remaining = Number(budget.limit_amount) - spent;
      
      return {
        ...budget,
        categoryName: category?.name || 'Categoria não encontrada',
        categoryColor: category?.color || '#3B82F6',
        spent,
        percentage: Math.round(percentage),
        remaining,
        status: percentage > 100 ? 'exceeded' : percentage > 80 ? 'warning' : 'good'
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categories, transactions, selectedMonth]);

  const summary = useMemo(() => {
    const totalBudget = budgetAnalysis.reduce((sum, item) => sum + Number(item.limit_amount), 0);
    const totalSpent = budgetAnalysis.reduce((sum, item) => sum + item.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overBudgetCount = budgetAnalysis.filter(item => item.status === 'exceeded').length;
    const warningCount = budgetAnalysis.filter(item => item.status === 'warning').length;
    const goodCount = budgetAnalysis.filter(item => item.status === 'good').length;

    return { totalBudget, totalSpent, totalRemaining, overBudgetCount, warningCount, goodCount };
  }, [budgetAnalysis]);

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando análise de orçamentos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Análise de Orçamentos</CardTitle>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {budgetAnalysis.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum orçamento encontrado para análise
          </div>
        ) : (
          <>
            {/* Resumo Executivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-blue-700">Orçamento Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalBudget)}</p>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-red-700">Total Gasto</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalSpent)}</p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-green-700">Disponível</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRemaining)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-700">Status Geral</p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {summary.goodCount}
                    </Badge>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {summary.warningCount}
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      {summary.overBudgetCount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Barras Comparativo */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Orçamento vs Gastos por Categoria</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="categoryName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tickFormatter={(value) => `R$ ${value/1000}K`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="limit_amount" name="Orçamento" fill="#94a3b8" />
                    <Bar dataKey="spent" name="Gasto" fill="#0c6291" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lista Detalhada de Orçamentos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalhamento por Categoria</h3>
              {budgetAnalysis.map((budget, index) => (
                <Card key={budget.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: budget.categoryColor }}
                        />
                        <h4 className="font-semibold">{budget.categoryName}</h4>
                        <Badge 
                          variant={budget.status === 'exceeded' ? 'destructive' : 
                                  budget.status === 'warning' ? 'secondary' : 'default'}
                        >
                          {budget.status === 'exceeded' ? 'Excedido' : 
                           budget.status === 'warning' ? 'Atenção' : 'Ok'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.limit_amount))}
                        </p>
                        <p className="font-semibold">{budget.percentage}%</p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={Math.min(budget.percentage, 100)} 
                      className="h-2 mb-2"
                    />
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        {budget.remaining >= 0 ? 'Restante' : 'Excesso'}: 
                        <span className={budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(Math.abs(budget.remaining))}
                        </span>
                      </span>
                      <span>
                        Período: {new Date(budget.start_date).toLocaleDateString('pt-BR')} - {new Date(budget.end_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetAnalysisReport;
