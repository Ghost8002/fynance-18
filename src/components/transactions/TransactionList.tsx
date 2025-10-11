
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Edit, Trash2 } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";
import TransactionEditForm from "./TransactionEditForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

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

import { parseLocalDate, compareDateStrings } from "@/utils/dateValidation";

const TransactionList = () => {
  const { user } = useAuth();
  const { data: transactions = [], loading, error, remove, refetch } = useSupabaseData('transactions', user?.id);
  const { data: categories = [] } = useSupabaseData('categories', user?.id);
  const { data: accounts = [] } = useSupabaseData('accounts', user?.id);
  const { data: cards = [] } = useSupabaseData('cards', user?.id);
  const { toast } = useToast();

  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
        const transactionDate = parseLocalDate(transaction.date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
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
            sevenDaysAgo.setHours(0, 0, 0, 0);
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
    }).sort((a, b) => compareDateStrings(b.date, a.date));
  }, [transactions, filters]);

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransactionForEdit(transaction);
    setEditDialogOpen(true);
  };

  const handleDeleteTransaction = async (id: string, description: string) => {
    try {
      const { error } = await remove(id);
      if (error) {
        throw new Error(error);
      }
      toast({
        title: "Sucesso",
        description: `Transação "${description}" removida com sucesso!`
      });
    } catch (error) {
      console.error('Erro ao remover transação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a transação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditSuccess = () => {
    refetch();
  };

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
                <TableHead>Ações</TableHead>
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
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover transação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover a transação "{transaction.description}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTransaction(transaction.id, transaction.description)} className="bg-red-600 hover:bg-red-700">
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog para edição de transação */}
      {selectedTransactionForEdit && (
        <TransactionEditForm
          transaction={selectedTransactionForEdit}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default TransactionList;
