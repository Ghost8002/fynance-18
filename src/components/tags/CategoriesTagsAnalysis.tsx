
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState, useEffect } from "react";
import { PeriodFilter, type PeriodType } from "@/components/dashboard/PeriodFilter";

interface TagData {
  id: string;
  name: string;
  color: string;
  amount: number;
  transactionCount: number;
}

interface CategoryData {
  id: string;
  name: string;
  color: string;
  totalAmount: number;
  totalTransactions: number;
  tags: TagData[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const CategoriesTagsAnalysis = () => {
  const { user } = useAuth();
  const { data: transactions, refetch: refetchTransactions } = useSupabaseData('transactions', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const [period, setPeriod] = useState<PeriodType>('current-month');
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for transaction events
  useEffect(() => {
    const handleTransactionAdded = async () => {
      console.log('CategoriesTagsAnalysis: Received transaction added event');
      await refetchTransactions();
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('transactionWithTagsAdded', handleTransactionAdded);
    return () => window.removeEventListener('transactionWithTagsAdded', handleTransactionAdded);
  }, [refetchTransactions]);

  const filteredTransactions = useMemo(() => {
    console.log('CategoriesTagsAnalysis: Processing transactions', {
      totalTransactions: transactions?.length || 0,
      sampleTransaction: transactions?.[0] || null,
      period: period
    });

    if (!transactions?.length) return [];

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'last-6-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter transactions by date and include those with or without tags for better visualization
    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= now;
    });

    console.log('CategoriesTagsAnalysis: Filtered by date', {
      original: transactions.length,
      filtered: filtered.length,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });

    return filtered;
  }, [transactions, period, refreshKey]);

  const categoryTagsAnalysis = useMemo(() => {
    console.log('CategoriesTagsAnalysis: Building analysis', {
      filteredTransactions: filteredTransactions?.length || 0,
      categories: categories?.length || 0
    });

    if (!filteredTransactions?.length || !categories?.length) return [];

    const categoryMap: Record<string, CategoryData> = {};

    // Initialize categories
    categories.forEach(cat => {
      categoryMap[cat.id] = {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        totalAmount: 0,
        totalTransactions: 0,
        tags: []
      };
    });

    // Process all transactions
    filteredTransactions.forEach(transaction => {
      if (!transaction.category_id) return;

      const category = categoryMap[transaction.category_id];
      if (!category) return;

      const amount = Number(transaction.amount);
      category.totalAmount += amount;
      category.totalTransactions += 1;

      // Process transaction tags if they exist
      const transactionTags = Array.isArray(transaction.tags) ? transaction.tags : [];
      
      transactionTags.forEach((tag: any) => {
        if (tag && typeof tag === 'object' && tag.id) {
          let existingTag = category.tags.find(t => t.id === tag.id);
          if (!existingTag) {
            existingTag = {
              id: tag.id,
              name: tag.name || 'Tag sem nome',
              color: tag.color || '#3B82F6',
              amount: 0,
              transactionCount: 0
            };
            category.tags.push(existingTag);
          }
          existingTag.amount += amount;
          existingTag.transactionCount += 1;
        }
      });
    });

    // Convert to array and filter categories with transactions
    const result = Object.values(categoryMap)
      .filter(cat => cat.totalTransactions > 0)
      .map(cat => ({
        ...cat,
        tags: cat.tags.sort((a, b) => b.amount - a.amount)
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    console.log('CategoriesTagsAnalysis: Final analysis', {
      categoriesWithTransactions: result.length,
      totalCategories: categories.length,
      categoriesWithTags: result.filter(cat => cat.tags.length > 0).length
    });

    return result;
  }, [filteredTransactions, categories, refreshKey]);

  const exportData = () => {
    if (!categoryTagsAnalysis.length) return;

    const csvContent = [
      ['Categoria', 'Tag', 'Valor Total', 'Número de Transações'],
      ...categoryTagsAnalysis.flatMap(category =>
        category.tags.length > 0 
          ? category.tags.map(tag => [
              category.name,
              tag.name,
              tag.amount.toFixed(2),
              tag.transactionCount.toString()
            ])
          : [[category.name, 'Sem tags', category.totalAmount.toFixed(2), category.totalTransactions.toString()]]
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `categorias-tags-${period}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalGeral = categoryTagsAnalysis.reduce((sum, cat) => sum + cat.totalAmount, 0);
  const totalTransactions = categoryTagsAnalysis.reduce((sum, cat) => sum + cat.totalTransactions, 0);
  const categoriesWithTags = categoryTagsAnalysis.filter(cat => cat.tags.length > 0).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Análise de Categorias e Tags</CardTitle>
            <CardDescription>
              Análise detalhada dos gastos por categoria e suas tags associadas
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <PeriodFilter value={period} onChange={setPeriod} />
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categoryTagsAnalysis.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Nenhuma transação encontrada no período selecionado</p>
              <p className="text-sm">Tente selecionar um período diferente</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-blue-700">Total Geral</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalGeral)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-green-700">Categorias Ativas</p>
                    <p className="text-2xl font-bold text-green-600">{categoryTagsAnalysis.length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-purple-700">Total de Transações</p>
                    <p className="text-2xl font-bold text-purple-600">{totalTransactions}</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-orange-700">Categorias com Tags</p>
                    <p className="text-2xl font-bold text-orange-600">{categoriesWithTags}</p>
                  </CardContent>
                </Card>
              </div>

              {categoryTagsAnalysis.map((category) => (
                <Card key={category.id} className="border-l-4" style={{ borderLeftColor: category.color }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                          style={{ backgroundColor: `${category.color}20`, borderColor: category.color }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {category.totalTransactions} transaç{category.totalTransactions === 1 ? 'ão' : 'ões'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {formatCurrency(category.totalAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {((category.totalAmount / totalGeral) * 100).toFixed(1)}% do total
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={(category.totalAmount / totalGeral) * 100} 
                      className="h-2"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.tags.length > 0 ? (
                        <>
                          <h4 className="font-medium text-sm text-muted-foreground mb-3">Tags desta categoria:</h4>
                          {category.tags.map((tag) => (
                            <div key={tag.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: `${tag.color}15`,
                                    borderColor: tag.color,
                                    color: tag.color
                                  }}
                                >
                                  {tag.name}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {tag.transactionCount} transaç{tag.transactionCount === 1 ? 'ão' : 'ões'}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatCurrency(tag.amount)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {((tag.amount / category.totalAmount) * 100).toFixed(1)}% da categoria
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm">Esta categoria não possui transações com tags</p>
                          <p className="text-xs">Considere adicionar tags às suas transações para uma análise mais detalhada</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoriesTagsAnalysis;
