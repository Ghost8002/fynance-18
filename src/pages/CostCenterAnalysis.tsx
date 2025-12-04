import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from "recharts";
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Calendar, Tag, Filter, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppLayout from "@/components/shared/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { devError } from "@/utils/logger";

interface SubcategoryDetail {
  id: string;
  name: string;
  totalSpent: number;
  totalIncome: number;
  transactionCount: number;
}

interface TagDetail {
  id: string;
  name: string;
  color: string;
  count: number;
  totalAmount: number;
}

const CostCenterAnalysis = () => {
  const { user } = useAuth();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch data
  const { data: categories, refetch: refetchCategories } = useSupabaseData('categories' as any, user?.id);
  const { data: transactions } = useSupabaseData('transactions' as any, user?.id);
  const { data: subcategories } = useSupabaseData('subcategories' as any, user?.id);
  const { data: tags } = useSupabaseData('tags' as any, user?.id);
  
  // State for detailed data
  const [subcategoriesData, setSubcategoriesData] = useState<SubcategoryDetail[]>([]);
  const [tagsData, setTagsData] = useState<TagDetail[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  // Find the selected category
  useEffect(() => {
    if (categories && categoryId) {
      const category = categories.find(c => c.id === categoryId);
      setSelectedCategory(category);
    }
  }, [categories, categoryId]);
  
  // Calculate detailed data
  useEffect(() => {
    if (!categoryId || !transactions || !subcategories || !tags) return;
    
    const costCenterTransactions = transactions.filter(t => t.category_id === categoryId);
    
    // Calculate subcategories data
    const subcategoryMap = new Map<string, SubcategoryDetail>();
    subcategories
      .filter(s => s.category_id === categoryId)
      .forEach(sub => {
        const subTransactions = costCenterTransactions.filter(t => t.subcategory_id === sub.id);
        const totalSpent = subTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = subTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
          
        subcategoryMap.set(sub.id, {
          id: sub.id,
          name: sub.name,
          totalSpent,
          totalIncome,
          transactionCount: subTransactions.length
        });
      });
    
    // Add transactions without subcategory
    const noSubcategoryTransactions = costCenterTransactions.filter(t => !t.subcategory_id);
    if (noSubcategoryTransactions.length > 0) {
      const totalSpent = noSubcategoryTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = noSubcategoryTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      subcategoryMap.set('no-subcategory', {
        id: 'no-subcategory',
        name: 'Sem subcategoria',
        totalSpent,
        totalIncome,
        transactionCount: noSubcategoryTransactions.length
      });
    }
    
    setSubcategoriesData(Array.from(subcategoryMap.values()));
    
    // Calculate tags data
    const tagMap = new Map<string, TagDetail>();
    costCenterTransactions.forEach(transaction => {
      if (transaction.tags && Array.isArray(transaction.tags)) {
        transaction.tags.forEach(tag => {
          const existing = tagMap.get(tag.id);
          if (existing) {
            tagMap.set(tag.id, {
              ...existing,
              count: existing.count + 1,
              totalAmount: existing.totalAmount + transaction.amount
            });
          } else {
            const tagInfo = tags?.find(t => t.id === tag.id) || tag;
            tagMap.set(tag.id, {
              id: tag.id,
              name: tagInfo.name,
              color: tagInfo.color,
              count: 1,
              totalAmount: transaction.amount
            });
          }
        });
      }
    });
    
    setTagsData(Array.from(tagMap.values()));
    
    // Calculate monthly data for the last 12 months
    const monthlyMap = new Map<string, { month: string; income: number; expense: number }>();
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
      monthlyMap.set(key, { month: monthLabel, income: 0, expense: 0 });
    }
    
    costCenterTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = format(date, 'yyyy-MM');
      const existing = monthlyMap.get(key);
      if (existing) {
        if (transaction.type === 'income') {
          monthlyMap.set(key, { ...existing, income: existing.income + transaction.amount });
        } else {
          monthlyMap.set(key, { ...existing, expense: existing.expense + transaction.amount });
        }
      }
    });
    
    setMonthlyData(Array.from(monthlyMap.values()));
  }, [categoryId, transactions, subcategories, tags]);
  
  // Calculate summary KPIs
  const totalTransactions = useMemo(() => {
    return subcategoriesData.reduce((sum, sub) => sum + sub.transactionCount, 0);
  }, [subcategoriesData]);
  
  const totalSpent = useMemo(() => {
    return subcategoriesData.reduce((sum, sub) => sum + sub.totalSpent, 0);
  }, [subcategoriesData]);
  
  const totalIncome = useMemo(() => {
    return subcategoriesData.reduce((sum, sub) => sum + sub.totalIncome, 0);
  }, [subcategoriesData]);
  
  const netBalance = totalIncome - totalSpent;
  
  const averageMonthly = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    const total = monthlyData.reduce((sum, month) => sum + (month.income - month.expense), 0);
    return total / monthlyData.length;
  }, [monthlyData]);
  
  const mostUsedTag = useMemo(() => {
    if (tagsData.length === 0) return null;
    return tagsData.reduce((prev, current) => (prev.count > current.count) ? prev : current);
  }, [tagsData]);
  
  const mostExpensiveSubcategory = useMemo(() => {
    if (subcategoriesData.length === 0) return null;
    const expenseSubcategories = subcategoriesData.filter(s => s.totalSpent > 0);
    if (expenseSubcategories.length === 0) return null;
    return expenseSubcategories.reduce((prev, current) => (prev.totalSpent > current.totalSpent) ? prev : current);
  }, [subcategoriesData]);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  const handleDeleteCostCenter = async (categoryId: string, categoryName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover "${categoryName}" dos centros de custo? Esta ação não excluirá a categoria, apenas removerá sua marcação como centro de custo.`)) {
      return;
    }
    
    try {
      // Remover a marcação de is_cost_center
      const { error: updateError } = await supabase
        .from('categories' as any)
        .update({ is_cost_center: false } as any)
        .eq('id', categoryId)
        .eq('user_id', user?.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Sucesso",
        description: `"${categoryName}" foi removido dos centros de custo.`
      });
      
      // Atualizar os dados
      refetchCategories();
      
      // Redirecionar de volta para a página de relatórios
      navigate('/reports');
    } catch (error) {
      devError('Error removing cost center:', error);
      toast({
        title: "Erro",
        description: `Erro ao remover centro de custo: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  if (!selectedCategory) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-finance-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados do centro de custo...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análise de Centro de Custo</h1>
            <p className="text-muted-foreground">Análise detalhada de {selectedCategory?.name}</p>
          </div>
          {selectedCategory && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => handleDeleteCostCenter(selectedCategory.id, selectedCategory.name)}
              className="ml-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover Centro de Custo
            </Button>
          )}
        </div>
        
        {/* Category Info */}
        {selectedCategory && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <h2 className="text-xl font-semibold">{selectedCategory.name}</h2>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {totalSpent.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              {netBalance >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {netBalance.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${averageMonthly >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {averageMonthly.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tag Mais Usada</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {mostUsedTag ? (
                <div className="flex items-center gap-2">
                  <Badge style={{ backgroundColor: mostUsedTag.color }} className="text-white">
                    {mostUsedTag.name}
                  </Badge>
                  <span>({mostUsedTag.count} vezes)</span>
                </div>
              ) : (
                <div className="text-muted-foreground">Nenhuma tag</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subcategoria Mais Onerosa</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {mostExpensiveSubcategory ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{mostExpensiveSubcategory.name}</span>
                  <span className="text-red-500">
                    {mostExpensiveSubcategory.totalSpent.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </span>
                </div>
              ) : (
                <div className="text-muted-foreground">Nenhuma subcategoria</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Subcategories Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subcategorias</CardTitle>
                <CardDescription>
                  Distribuição por subcategorias
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead className="text-right">Transações</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategoriesData.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      {sub.id === 'no-subcategory' ? (
                        <span className="italic text-muted-foreground">Sem subcategoria</span>
                      ) : (
                        sub.name
                      )}
                    </TableCell>
                    <TableCell className="text-right">{sub.transactionCount}</TableCell>
                    <TableCell className="text-right text-red-500">
                      {sub.totalSpent.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </TableCell>
                    <TableCell className="text-right text-green-500">
                      {sub.totalIncome.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${sub.totalIncome - sub.totalSpent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {(sub.totalIncome - sub.totalSpent).toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Subcategories Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Subcategorias</CardTitle>
              <CardDescription>
                Proporção de gastos por subcategoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {subcategoriesData.filter(s => s.totalSpent > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subcategoriesData.filter(s => s.totalSpent > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalSpent"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {subcategoriesData.filter(s => s.totalSpent > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [
                          Number(value).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          }), 
                          'Valor'
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Nenhum dado para exibir</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Line Chart - Monthly Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <CardDescription>
                Receitas e despesas nos últimos 12 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => 
                        Number(value).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })
                      }
                    />
                    <Tooltip 
                      formatter={(value) => [
                        Number(value).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }), 
                        'Valor'
                      ]}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      name="Receitas" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      name="Despesas" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tags Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tags Associadas</CardTitle>
                <CardDescription>
                  Tags mais utilizadas neste centro de custo
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {tagsData.length > 0 ? (
                tagsData
                  .sort((a, b) => b.count - a.count)
                  .map((tag) => (
                    <Badge 
                      key={tag.id} 
                      style={{ backgroundColor: tag.color }}
                      className="text-white px-3 py-1.5"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                      <span className="ml-1 font-medium">({tag.count})</span>
                    </Badge>
                  ))
              ) : (
                <p className="text-muted-foreground">Nenhuma tag associada</p>
              )}
            </div>
            
            {tagsData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tagsData.slice(0, 10)}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={90}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [
                        Number(value).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }), 
                        'Valor'
                      ]}
                    />
                    <Bar dataKey="totalAmount" name="Valor" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CostCenterAnalysis;