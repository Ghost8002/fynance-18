import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import TransactionFiltersAdvancedMobile from "./TransactionFiltersAdvancedMobile";
import TransactionCardMobile from "./TransactionCardMobile";
import TransactionForm from "@/components/shared/TransactionForm";
import { useTransactionsPaginated, type TransactionFilters } from "@/hooks/useTransactionsPaginated";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const TransactionListMobile = () => {
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
  } = useTransactionsPaginated(filters, 20); // Load 20 items per page on mobile

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
      console.error('Error updating transaction:', error);
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
      console.error('Error deleting transaction:', error);
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
            <Button size="sm" className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nova
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base">Nova Transação</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-[calc(90vh-80px)]">
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
                className="h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
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
                className="h-8 text-xs"
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
                className="h-8 text-xs"
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
