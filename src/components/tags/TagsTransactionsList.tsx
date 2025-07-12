
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTags } from "@/hooks/useTags";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TagsTransactionsList = () => {
  const { user } = useAuth();
  const { tags } = useTags();
  const { data: transactions, refetch: refetchTransactions } = useSupabaseData('transactions', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const [selectedTagId, setSelectedTagId] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Escuta eventos de transações adicionadas
  useEffect(() => {
    const handleTransactionAdded = async () => {
      console.log('TagsTransactionsList: Received transaction added event');
      await refetchTransactions();
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('transactionWithTagsAdded', handleTransactionAdded);
    return () => window.removeEventListener('transactionWithTagsAdded', handleTransactionAdded);
  }, [refetchTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!transactions?.length) return [];

    // Filtrar apenas transações que têm tags
    let filtered = transactions.filter(transaction =>
      transaction.tags && Array.isArray(transaction.tags) && transaction.tags.length > 0
    );

    if (selectedTagId !== "all") {
      filtered = filtered.filter(transaction =>
        transaction.tags.some((tag: any) => tag.id === selectedTagId)
      );
    }

    return filtered
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20); // Show last 20 transactions
  }, [transactions, selectedTagId, refreshKey]);

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Transações por Tags</CardTitle>
            <CardDescription>
              Últimas transações categorizadas com tags
            </CardDescription>
          </div>
          <Select value={selectedTagId} onValueChange={setSelectedTagId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tags</SelectItem>
              {tags?.filter(tag => tag.is_active).map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Nenhuma transação encontrada</p>
            <p className="text-sm">
              {selectedTagId === "all" 
                ? "Adicione tags às suas transações para vê-las aqui"
                : "Nenhuma transação encontrada para a tag selecionada"
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.description}
                  </TableCell>
                  <TableCell>
                    {getCategoryName(transaction.category_id)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {transaction.tags.map((tag: any) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="flex items-center gap-1 text-xs"
                          style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.type === 'income' ? 'default' : 'secondary'}
                      className={transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={transaction.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {transaction.type === 'income' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TagsTransactionsList;
