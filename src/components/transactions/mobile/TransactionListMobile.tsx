import { useState, useMemo } from "react";
import { Plus, Loader2, TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";
import { applyTransactionFilters } from "@/hooks/utils/transactionFilters";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TransactionFiltersAdvancedMobile from "./TransactionFiltersAdvancedMobile";
import TransactionCardMobile from "./TransactionCardMobile";
import TransactionForm from "@/components/shared/TransactionForm";
import { useTransactionsPaginatedServer } from "@/hooks/useTransactionsPaginatedServer";
import { type TransactionFilters } from "@/hooks/types/transactionTypes";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { devError } from "@/utils/logger";

const TransactionListMobile = () => {
  const { user } = useAuth();
  const [newTransactionKey, setNewTransactionKey] = useState(0);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    dateRange: "current-month",
    type: "all",
    categoryId: "all",
    accountId: "all",
    cardId: "all",
    minAmount: "",
    maxAmount: "",
  });

  // Fetch all transactions for summary cards
  const { data: allTransactions } = useSupabaseData('transactions', user?.id);

  const {
    transactions,
    loading,
    error,
    update,
    remove,
    categories,
    accounts,
    cards,
    pagination,
  } = useTransactionsPaginatedServer(filters, { itemsPerPage: 20 }); // Load 20 items per page on mobile

  // Calculate summary data based on filtered transactions
  const summaryData = useMemo(() => {
    const filteredForSummary = applyTransactionFilters(allTransactions || [], filters);
    
    const totalIncome = filteredForSummary
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = filteredForSummary
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpenses;
    const transactionCount = filteredForSummary.length;

    return { totalIncome, totalExpenses, balance, transactionCount };
  }, [allTransactions, filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Create lookup maps for efficient display
  const categoryMap = categories.reduce((acc: Record<string, any>, cat: any) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const accountMap = accounts.reduce((acc: Record<string, string>, account: any) => {
    acc[account.id] = `${account.name}`;
    return acc;
  }, {});

  const cardMap = cards.reduce((acc: Record<string, string>, card: any) => {
    acc[card.id] = `${card.name} *${card.last_four_digits}`;
    return acc;
  }, {});

  const handleUpdate = async (transactionId: string, data: any): Promise<any> => {
    try {
      const result = await update(transactionId, data);
      if (result.error) {
        toast.error("Erro ao atualizar transação");
      } else {
        toast.success("Transação atualizada com sucesso!");
      }
      return result;
    } catch (error) {
      devError('Error updating transaction:', error);
      toast.error("Erro ao atualizar transação");
      throw error;
    }
  };

  const handleDelete = async (transactionId: string): Promise<any> => {
    try {
      const result = await remove(transactionId);
      if (result.error) {
        toast.error("Erro ao excluir transação");
      } else {
        toast.success("Transação excluída com sucesso!");
      }
      return result;
    } catch (error) {
      devError('Error deleting transaction:', error);
      toast.error("Erro ao excluir transação");
      throw error;
    }
  };

  const handleTransactionAdded = () => {
    setNewTransactionKey(prev => prev + 1);
    setIsAddSheetOpen(false);
    toast.success("Transação adicionada com sucesso!");
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <TransactionFiltersAdvancedMobile
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          accounts={accounts}
          cards={cards}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <TransactionFiltersAdvancedMobile
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          accounts={accounts}
          cards={cards}
        />
        <div className="text-center py-12 text-sm text-destructive">
          Erro ao carregar transações. Tente novamente.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <TransactionFiltersAdvancedMobile
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        accounts={accounts}
        cards={cards}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-card-foreground">
              Receitas
            </CardTitle>
            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="h-3 w-3 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(summaryData.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-card-foreground">
              Despesas
            </CardTitle>
            <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/20">
              <TrendingDown className="h-3 w-3 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(summaryData.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-card-foreground">
              Saldo
            </CardTitle>
            <div className={`p-1.5 rounded-full ${summaryData.balance >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              <DollarSign className={`h-3 w-3 ${summaryData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className={`text-lg font-bold ${summaryData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summaryData.balance)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
            <CardTitle className="text-xs font-medium text-card-foreground">
              Total
            </CardTitle>
            <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Receipt className="h-3 w-3 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-blue-600">
              {summaryData.transactionCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Transações</h2>
          <p className="text-xs text-muted-foreground">
            {pagination.totalItems} {pagination.totalItems === 1 ? 'transação' : 'transações'}
          </p>
        </div>
        
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="h-7 text-xs px-3">
              <Plus className="h-3 w-3 mr-1" />
              Nova
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] rounded-t-xl px-2 sm:px-3 md:px-4 flex flex-col">
            <SheetHeader className="mb-2 sm:mb-3 pb-2 border-b flex-shrink-0">
              <SheetTitle className="text-sm font-medium">Nova Transação</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto flex-1 -mx-1 sm:-mx-2 px-1 sm:px-2 pb-2 sm:pb-4">
              <TransactionForm 
                key={newTransactionKey}
                onTransactionAdded={handleTransactionAdded}
                onCancel={() => setIsAddSheetOpen(false)}
                forceOpen
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Transactions list */}
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma transação encontrada
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsAddSheetOpen(true)}
                className="h-7 text-xs px-3"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar primeira transação
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <TransactionCardMobile
                key={transaction.id}
                transaction={transaction}
                categoryMap={categoryMap}
                accountMap={accountMap}
                cardMap={cardMap}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pagination.goToPrevPage}
                disabled={!pagination.hasPrevPage}
                className="h-7 text-xs px-3"
              >
                Anterior
              </Button>
              
              <span className="text-xs text-muted-foreground">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={pagination.goToNextPage}
                disabled={!pagination.hasNextPage}
                className="h-7 text-xs px-3"
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionListMobile;
