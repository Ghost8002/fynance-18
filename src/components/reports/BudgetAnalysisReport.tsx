
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
import { usePeriodFilter } from "@/pages/Reports";

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
  const { period, customStartDate, customEndDate } = usePeriodFilter();

  const loading = budgetsLoading || categoriesLoading || transactionsLoading;

  const budgetAnalysis = useMemo(() => {
    if (!budgets || !categories || !transactions) return [];

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
      return transactionDate >= startDate && 
             transactionDate <= endDate &&
             t.type === 'expense';
    });

    return budgets.map(budget => {
      const category = categories.find(c => c.id === budget.category_id);
      const spent = periodTransactions
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
  }, [budgets, categories, transactions, period, customStartDate, customEndDate]);

  const summary = useMemo(() => {
    const totalBudget = budgetAnalysis.reduce((sum, item) => sum + Number(item.limit_amount), 0);
    const totalSpent = budgetAnalysis.reduce((sum, item) => sum + item.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overBudgetCount = budgetAnalysis.filter(item => item.status === 'exceeded').length;
    const warningCount = budgetAnalysis.filter(item => item.status === 'warning').length;
    const goodCount = budgetAnalysis.filter(item => item.status === 'good').length;

    return { totalBudget, totalSpent, totalRemaining, overBudgetCount, warningCount, goodCount };
  }, [budgetAnalysis]);


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
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {budgetAnalysis.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhum orçamento encontrado para análise
          </div>
        ) : (
          <>
            {/* Resumo Executivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Orçamento Total</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(summary.totalBudget)}</p>
                </CardContent>
              </Card>

              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Total Gasto</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.totalSpent)}</p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Disponível</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.totalRemaining)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Geral</p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {summary.goodCount}
                    </Badge>
                    <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {summary.warningCount}
                    </Badge>
                    <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400">
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
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--foreground)'
                      }}
                      cursor={{ fill: 'transparent' }}
                    />
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.limit_amount))}
                        </p>
                        <p className="font-semibold">{budget.percentage}%</p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={Math.min(budget.percentage, 100)} 
                      className="h-2 mb-2"
                    />
                    
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {budget.remaining >= 0 ? 'Restante' : 'Excesso'}: 
                        <span className={budget.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
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
