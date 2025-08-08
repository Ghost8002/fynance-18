import { useState } from "react";
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
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import TransactionFiltersAdvanced from "./TransactionFiltersAdvanced";
import TransactionForm from "@/components/shared/TransactionForm";
import TransactionTable from "./TransactionTable";
import { useTransactionsPaginated, type TransactionFilters } from "@/hooks/useTransactionsPaginated";

const TransactionListAdvanced = () => {
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

  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);

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
    pagination,
  } = useTransactionsPaginated(filters);

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
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Histórico de Transações ({pagination.totalItems})
            </CardTitle>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowNewTransactionForm(!showNewTransactionForm)}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
              <div className="text-sm text-muted-foreground">
                Página {pagination.currentPage} de {pagination.totalPages}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {showNewTransactionForm && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Nova Transação</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewTransactionForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionForm inline onTransactionAdded={() => setShowNewTransactionForm(false)} onCancel={() => setShowNewTransactionForm(false)} />
              </CardContent>
            </Card>
          )}

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
