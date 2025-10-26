import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Tag, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface CostCenter {
  id: string;
  name: string;
  color: string;
  totalTransactions: number;
  totalSpent: number;
  totalIncome: number;
  balance: number;
  lastTransactionDate?: string;
}

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

const CostCentersReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Fetch data
  const { data: categories, refetch: refetchCategories } = useSupabaseData('categories' as any, user?.id);
  const { data: transactions } = useSupabaseData('transactions' as any, user?.id);
  const { data: subcategories } = useSupabaseData('subcategories' as any, user?.id);
  const { data: tags } = useSupabaseData('tags' as any, user?.id);
  
  // State for cost centers (categories marked as cost centers)
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [subcategoriesData, setSubcategoriesData] = useState<SubcategoryDetail[]>([]);
  const [tagsData, setTagsData] = useState<TagDetail[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  
  // Filter categories to only show those marked as cost centers
  const costCenterCategories = useMemo(() => {
    return categories?.filter(category => category.is_cost_center) || [];
  }, [categories]);
  
  // Calculate cost centers data
  useEffect(() => {
    if (!transactions || !categories) return;
    
    const newCostCenters: CostCenter[] = costCenterCategories.map(category => {
      const categoryTransactions = transactions.filter(t => t.category_id === category.id);
      
      const totalSpent = categoryTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalIncome = categoryTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const lastTransaction = categoryTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      return {
        id: category.id,
        name: category.name,
        color: category.color,
        totalTransactions: categoryTransactions.length,
        totalSpent,
        totalIncome,
        balance: totalIncome - totalSpent,
        lastTransactionDate: lastTransaction?.date
      };
    });
    
    setCostCenters(newCostCenters);
  }, [transactions, categories, costCenterCategories]);
  
  // Calculate detailed data when a cost center is selected
  useEffect(() => {
    if (!selectedCostCenter || !transactions || !subcategories || !tags) return;
    
    const costCenterTransactions = transactions.filter(t => t.category_id === selectedCostCenter.id);
    
    // Calculate subcategories data
    const subcategoryMap = new Map<string, SubcategoryDetail>();
    subcategories
      .filter(s => s.category_id === selectedCostCenter.id)
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
            tagMap.set(tag.id, {
              id: tag.id,
              name: tag.name,
              color: tag.color,
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
  }, [selectedCostCenter, transactions, subcategories, tags]);
  
  const handleCostCenterSelect = (costCenter: CostCenter) => {
    // Redirecionar para a página de análise usando navigate em vez de window.location
    navigate(`/centro-custo/${costCenter.id}`);
  };
  
  // Função para marcar uma categoria como centro de custo
  const handleMarkAsCostCenter = async (categoryId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('categories' as any)
        .update({ is_cost_center: true } as any)
        .eq('id', categoryId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Atualizar os dados
      refetchCategories();
    } catch (err) {
      console.error('Erro ao marcar categoria como centro de custo:', err);
    }
  };
  
  // Função para remover uma categoria dos centros de custo
  const handleRemoveCostCenter = async (categoryId: string, categoryName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover "${categoryName}" dos centros de custo?`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('categories' as any)
        .update({ is_cost_center: false } as any)
        .eq('id', categoryId)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      // Atualizar os dados
      refetchCategories();
      
      toast({
        title: "Sucesso",
        description: `"${categoryName}" foi removido dos centros de custo.`
      });
    } catch (err) {
      console.error('Erro ao remover centro de custo:', err);
      toast({
        title: "Erro",
        description: `Erro ao remover centro de custo: ${err.message}`,
        variant: "destructive"
      });
    }
  };
  
  // Calculate summary KPIs
  const totalCostCenters = costCenters.length;
  const totalTransactions = costCenters.reduce((sum, cc) => sum + cc.totalTransactions, 0);
  const totalSpent = costCenters.reduce((sum, cc) => sum + cc.totalSpent, 0);
  const totalIncome = costCenters.reduce((sum, cc) => sum + cc.totalIncome, 0);
  const netBalance = totalIncome - totalSpent;
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  if (costCenterCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum centro de custo definido ainda</h3>
          <p className="text-muted-foreground mb-6">
            Selecione uma categoria para começar a gerenciar seus centros de custo.
          </p>
          <Button onClick={() => setShowCategorySelector(true)}>
            Selecionar categorias como centros de custo
          </Button>
        </div>
        
        {/* Seletor de categorias */}
        {showCategorySelector && (
          <Card className="mt-8 w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Selecionar Categoria como Centro de Custo</CardTitle>
              <CardDescription>
                Escolha as categorias que deseja marcar como centros de custo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.filter(c => !c.is_cost_center).map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkAsCostCenter(category.id)}
                        >
                          Definir como centro de custo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!categories || categories.filter(c => !c.is_cost_center).length === 0) && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma categoria disponível para seleção
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header com botão para selecionar mais categorias */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Centros de Custo</h2>
          <p className="text-muted-foreground">
            Gerencie e analise seus centros de custo
          </p>
        </div>
        <Button onClick={() => setShowCategorySelector(true)}>
          Selecionar Categoria como Centro de Custo
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Centros</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCostCenters}</div>
            <p className="text-xs text-muted-foreground">Centros de custo ativos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Em todos os centros</p>
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
            <p className="text-xs text-muted-foreground">Em todos os centros</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
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
            <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Seletor de categorias */}
      {showCategorySelector && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Categoria como Centro de Custo</CardTitle>
            <CardDescription>
              Escolha as categorias que deseja marcar como centros de custo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.filter(c => !c.is_cost_center).map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkAsCostCenter(category.id)}
                      >
                        Definir como centro de custo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(!categories || categories.filter(c => !c.is_cost_center).length === 0) && (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma categoria disponível para seleção
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Cost Centers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Centros de Custo</CardTitle>
          <CardDescription>
            Lista de categorias configuradas como centros de custo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centro de Custo</TableHead>
                <TableHead className="text-right">Total Transações</TableHead>
                <TableHead className="text-right">Total Gasto</TableHead>
                <TableHead className="text-right">Total Receita</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Última Movimentação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCenters.map((costCenter) => (
                <TableRow 
                  key={costCenter.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleCostCenterSelect(costCenter)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: costCenter.color }}
                      />
                      <span className="font-medium">{costCenter.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{costCenter.totalTransactions}</TableCell>
                  <TableCell className="text-right text-red-500">
                    {costCenter.totalSpent.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </TableCell>
                  <TableCell className="text-right text-green-500">
                    {costCenter.totalIncome.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${costCenter.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {costCenter.balance.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </TableCell>
                  <TableCell>
                    {costCenter.lastTransactionDate ? (
                      format(new Date(costCenter.lastTransactionDate), 'dd/MM/yyyy')
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCostCenter(costCenter.id, costCenter.name);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostCentersReport;