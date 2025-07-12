
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useTags } from "@/hooks/useTags";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useEffect, useState } from "react";

const TagsStatsCards = () => {
  const { user } = useAuth();
  const { tags } = useTags();
  const { data: transactions, refetch: refetchTransactions } = useSupabaseData('transactions', user?.id);
  const [refreshKey, setRefreshKey] = useState(0);

  // Escuta eventos de transações adicionadas
  useEffect(() => {
    const handleTransactionAdded = () => {
      console.log('TagsStatsCards: Received transaction added event');
      refetchTransactions();
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('transactionWithTagsAdded', handleTransactionAdded);
    return () => window.removeEventListener('transactionWithTagsAdded', handleTransactionAdded);
  }, [refetchTransactions]);

  const statsData = useMemo(() => {
    console.log('TagsStatsCards: Recalculating stats with transactions:', transactions?.length, 'tags:', tags?.length);
    
    if (!transactions?.length || !tags?.length) {
      return {
        totalTaggedTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        mostUsedTag: null
      };
    }

    // Filtrar apenas transações que têm tags
    const taggedTransactions = transactions.filter(transaction => 
      transaction.tags && Array.isArray(transaction.tags) && transaction.tags.length > 0
    );

    console.log('TagsStatsCards: Found tagged transactions:', taggedTransactions.length);

    const totalIncome = taggedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = taggedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Find most used tag
    const tagUsage: Record<string, number> = {};
    taggedTransactions.forEach(transaction => {
      transaction.tags.forEach((tag: any) => {
        tagUsage[tag.id] = (tagUsage[tag.id] || 0) + 1;
      });
    });

    const mostUsedTagId = Object.keys(tagUsage).reduce((a, b) => 
      tagUsage[a] > tagUsage[b] ? a : b, ""
    );

    const mostUsedTag = mostUsedTagId ? tags.find(tag => tag.id === mostUsedTagId) : null;

    const result = {
      totalTaggedTransactions: taggedTransactions.length,
      totalIncome,
      totalExpenses,
      mostUsedTag
    };

    console.log('TagsStatsCards: Calculated stats:', result);
    return result;
  }, [transactions, tags, refreshKey]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transações com Tags</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statsData.totalTaggedTransactions}</div>
          <p className="text-xs text-muted-foreground">
            Total de movimentações categorizadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas por Tags</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {statsData.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Receitas categorizadas por tags
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas por Tags</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            R$ {statsData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Despesas categorizadas por tags
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tag Mais Usada</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {statsData.mostUsedTag ? (
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="flex items-center gap-1 w-fit"
                style={{ backgroundColor: `${statsData.mostUsedTag.color}20`, borderColor: statsData.mostUsedTag.color }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statsData.mostUsedTag.color }}
                />
                {statsData.mostUsedTag.name}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Mais utilizada nas transações
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Nenhuma tag encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TagsStatsCards;
