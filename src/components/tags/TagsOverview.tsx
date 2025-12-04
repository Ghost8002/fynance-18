
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTags } from "@/hooks/useTags";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useEffect, useState } from "react";
import { devLog } from "@/utils/logger";

const TagsOverview = () => {
  const { user } = useAuth();
  const { tags } = useTags();
  const { data: transactions, refetch: refetchTransactions } = useSupabaseData('transactions', user?.id);
  const [refreshKey, setRefreshKey] = useState(0);

  // Escuta eventos de transações adicionadas
  useEffect(() => {
    const handleTransactionAdded = async () => {
      devLog('TagsOverview: Received transaction added event');
      await refetchTransactions();
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('transactionWithTagsAdded', handleTransactionAdded);
    return () => window.removeEventListener('transactionWithTagsAdded', handleTransactionAdded);
  }, [refetchTransactions]);

  const tagAnalysis = useMemo(() => {
    devLog('TagsOverview: Analyzing tags', {
      transactions: transactions?.length || 0,
      tags: tags?.length || 0
    });

    if (!transactions?.length || !tags?.length) return [];

    // Filtrar apenas transações que têm tags
    const transactionsWithTags = transactions.filter(transaction => 
      transaction.tags && Array.isArray(transaction.tags) && transaction.tags.length > 0
    );

    devLog('TagsOverview: Found transactions with tags:', transactionsWithTags.length);

    const tagStats = tags.map(tag => {
      const tagTransactions = transactionsWithTags.filter(transaction =>
        transaction.tags.some((t: any) => t.id === tag.id)
      );

      devLog(`Tag ${tag.name} has ${tagTransactions.length} associated transactions`);

      const income = tagTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = tagTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        ...tag,
        transactionsCount: tagTransactions.length,
        income,
        expenses,
        balance: income - expenses,
        totalAmount: income + expenses
      };
    }).filter(tag => tag.transactionsCount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);

    devLog('TagsOverview: Tag analysis result:', tagStats);
    return tagStats;
  }, [transactions, tags, refreshKey]);

  const maxAmount = Math.max(...tagAnalysis.map(tag => tag.totalAmount), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral das Tags</CardTitle>
        <CardDescription>
          Análise detalhada do uso e impacto financeiro de cada tag
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tagAnalysis.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Nenhuma transação com tags encontrada</p>
              <p className="text-sm">Comece adicionando tags às suas transações</p>
            </div>
          ) : (
            tagAnalysis.map((tag) => (
              <div key={tag.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {tag.transactionsCount} transaç{tag.transactionsCount === 1 ? 'ão' : 'ões'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      R$ {tag.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs ${tag.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Saldo: R$ {tag.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={(tag.totalAmount / maxAmount) * 100} 
                  className="h-2"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-green-600">
                    Receitas: R$ {tag.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-red-600">
                    Despesas: R$ {tag.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TagsOverview;
