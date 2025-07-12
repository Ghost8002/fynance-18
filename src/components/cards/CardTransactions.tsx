import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, CreditCard } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category_id: string;
  installments_count: number;
  installment_number: number;
  notes: string | null;
  tags: any;
}

interface CardTransactionsProps {
  cardId: string;
}

export const CardTransactions = ({ cardId }: CardTransactionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    period: "all"
  });

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const fetchTransactions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id);

      const categoryMap = categoriesData?.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {} as Record<string, string>) || {};

      setCategories(categoryMap);

      // Fetch transactions for this card
      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .eq('type', 'expense')
        .order('date', { ascending: false });

      if (error) throw error;

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [cardId, user?.id]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter
      if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category !== "all" && transaction.category_id !== filters.category) {
        return false;
      }

      // Period filter
      if (filters.period !== "all") {
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        
        switch (filters.period) {
          case "current-month":
            return transactionDate.getMonth() === now.getMonth() && 
                   transactionDate.getFullYear() === now.getFullYear();
          case "last-month":
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return transactionDate.getMonth() === lastMonth.getMonth() && 
                   transactionDate.getFullYear() === lastMonth.getFullYear();
          case "current-year":
            return transactionDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category_id)))
    .filter(Boolean)
    .map(id => ({ id, name: categories[id] || 'Sem categoria' }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Transações do Cartão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Carregando transações...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard size={20} />
          Transações do Cartão ({filteredTransactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>

          <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.period} onValueChange={(value) => setFilters({ ...filters, period: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="current-month">Mês atual</SelectItem>
              <SelectItem value="last-month">Mês passado</SelectItem>
              <SelectItem value="current-year">Ano atual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
            <p>
              {transactions.length === 0 
                ? "Nenhuma transação encontrada para este cartão"
                : "Nenhuma transação encontrada com os filtros aplicados"
              }
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Parcelamento</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{transaction.description}</p>
                        {transaction.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell className="font-medium text-red-600">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categories[transaction.category_id] || 'Sem categoria'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.installments_count > 1 ? (
                        <Badge variant="secondary">
                          {transaction.installment_number}/{transaction.installments_count}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">À vista</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {transaction.tags && Array.isArray(transaction.tags) && transaction.tags.length > 0 ? (
                          transaction.tags.map((tag: any) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                borderColor: tag.color,
                                color: tag.color
                              }}
                            >
                              {tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem tags</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total das transações filtradas:</span>
              <span className="font-bold text-lg text-red-600">
                {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};