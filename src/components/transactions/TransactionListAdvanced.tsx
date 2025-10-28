import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Loader2, Plus, X, TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";
import { toast } from "sonner";
import TransactionFiltersAdvanced from "./TransactionFiltersAdvanced";
import TransactionForm from "@/components/shared/TransactionForm";
import TransactionTable from "./TransactionTable";
import { useTransactionsPaginated, type TransactionFilters } from "@/hooks/useTransactionsPaginated";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { applyTransactionFilters } from "@/hooks/utils/transactionFilters";

const TransactionListAdvanced = () => {
  const { user } = useAuth();
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

  const [newTransactionKey, setNewTransactionKey] = useState(0);

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
    tags,
    subcategories,
    pagination,
  } = useTransactionsPaginated(filters);

  // Calculate summary data based on filtered transactions
  const summaryData = useMemo(() => {
    const filteredForSummary = applyTransactionFilters(allTransactions || [], filters);
    
    const totalIncome = filteredForSummary
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = filteredForSummary
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

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

  // Create lookup maps for better performance
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {} as Record<string, any>);

  const accountMap = accounts.reduce((acc, acc_item) => {
    acc[acc_item.id] = acc_item.name;
    return acc;
  }, {} as Record<string, string>);

  const cardMap = cards.reduce((acc, card) => {
    acc[card.id] = card.name;
    return acc;
  }, {} as Record<string, string>);

  const subcategoryMap = subcategories.reduce((acc, sub) => {
    acc[sub.id] = sub;
    return acc;
  }, {} as Record<string, any>);

  const handleUpdate = async (transactionId: string, data: any) => {
    try {
      const result = await update(transactionId, data);
      if (!result.error) {
        toast.success("Transação atualizada com sucesso!");
      } else {
        toast.error("Não foi possível atualizar a transação. Tente novamente.");
      }
      return result;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast.error("Não foi possível atualizar a transação. Tente novamente.");
      return { error: 'Erro interno' };
    }
  };

  const handleDelete = async (transactionId: string) => {
    try {
      const result = await remove(transactionId);
      if (!result.error) {
        toast.success("Transação excluída com sucesso!");
      } else {
        toast.error("Não foi possível excluir a transação. Tente novamente.");
      }
      return result;
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error("Não foi possível excluir a transação. Tente novamente.");
      return { error: 'Erro interno' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <TransactionFiltersAdvanced
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          accounts={accounts}
          cards={cards}
        />
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Carregando transações...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <TransactionFiltersAdvanced
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          accounts={accounts}
          cards={cards}
        />
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-red-500">
              Erro ao carregar transações: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TransactionFiltersAdvanced
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        accounts={accounts}
        cards={cards}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total de Receitas
            </CardTitle>
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryData.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Período filtrado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total de Despesas
            </CardTitle>
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summaryData.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Período filtrado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Saldo Líquido
            </CardTitle>
            <div className={`p-2 rounded-full ${summaryData.balance >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              <DollarSign className={`h-4 w-4 ${summaryData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summaryData.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryData.balance >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total de Transações
            </CardTitle>
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Receipt className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summaryData.transactionCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Transações filtradas
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Histórico de Transações ({pagination.totalItems})
            </CardTitle>
            <div className="flex items-center gap-4">
              <TransactionForm 
                key={newTransactionKey}
                onTransactionAdded={() => setNewTransactionKey(prev => prev + 1)}
              />
              <div className="text-sm text-muted-foreground">
                Página {pagination.currentPage} de {pagination.totalPages}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {pagination.totalItems === 0 
                ? "Nenhuma transação encontrada. Comece adicionando sua primeira transação!"
                : "Nenhuma transação encontrada com os filtros aplicados."
              }
            </div>
          ) : (
            <>
              <TransactionTable
                transactions={transactions}
                categoryMap={categoryMap}
                accountMap={accountMap}
                cardMap={cardMap}
                subcategoryMap={subcategoryMap}
                categories={categories}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />

              {pagination.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={pagination.goToPrevPage}
                        className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(
                        pagination.currentPage - 2 + i,
                        pagination.totalPages - 4 + i
                      ));
                      
                      if (pageNum > pagination.totalPages) return null;
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => pagination.goToPage(pageNum)}
                            isActive={pageNum === pagination.currentPage}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={pagination.goToNextPage}
                        className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionListAdvanced;