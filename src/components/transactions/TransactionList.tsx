
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('pt-BR', options);
};

const TransactionList = () => {
  const { user } = useAuth();
  const { data: transactions = [], loading, error } = useSupabaseData('transactions', user?.id);
  const { data: categories = [] } = useSupabaseData('categories', user?.id);
  const { data: accounts = [] } = useSupabaseData('accounts', user?.id);
  const { data: cards = [] } = useSupabaseData('cards', user?.id);

  const [filters, setFilters] = useState({
    search: "",
    dateRange: "current-month",
    type: "all",
    categoryId: "all",
    accountId: "all",
    cardId: "all",
  });

  // Create lookup maps for better performance
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const accountMap = useMemo(() => {
    return accounts.reduce((acc, acc_item) => {
      acc[acc_item.id] = acc_item.name;
      return acc;
    }, {} as Record<string, string>);
  }, [accounts]);

  const cardMap = useMemo(() => {
    return cards.reduce((acc, card) => {
      acc[card.id] = card.name;
      return acc;
    }, {} as Record<string, string>);
  }, [cards]);

  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];

    return transactions.filter(transaction => {
      // Search filter
      if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type !== "all" && transaction.type !== filters.type) {
        return false;
      }

      // Category filter
      if (filters.categoryId !== "all" && transaction.category_id !== filters.categoryId) {
        return false;
      }

      // Account filter
      if (filters.accountId !== "all" && transaction.account_id !== filters.accountId) {
        return false;
      }

      // Card filter
      if (filters.cardId !== "all" && transaction.card_id !== filters.cardId) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== "all") {
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        
        switch (filters.dateRange) {
          case "today":
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return transactionDate >= today && transactionDate < tomorrow;
          
          case "last-7-days":
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return transactionDate >= sevenDaysAgo;
          
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
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Transações</h2>
        <div className="text-center py-8">Carregando transações...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Transações</h2>
        <div className="text-center py-8 text-red-500">Erro ao carregar transações: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        Histórico de Transações ({filteredTransactions.length})
      </h2>
      
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {transactions.length === 0 
            ? "Nenhuma transação encontrada. Comece adicionando sua primeira transação!"
            : "Nenhuma transação encontrada com os filtros aplicados."
          }
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Conta/Cartão</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(Number(transaction.amount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {transaction.category_id ? categoryMap[transaction.category_id] || 'Sem categoria' : 'Sem categoria'}
                    </Badge>
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
                  <TableCell>
                    {transaction.account_id 
                      ? accountMap[transaction.account_id] || 'Conta removida'
                      : transaction.card_id 
                      ? cardMap[transaction.card_id] || 'Cartão removido'
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {transaction.type === "income" ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUpCircle size={16} />
                        <span>Receita</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <ArrowDownCircle size={16} />
                        <span>Despesa</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
