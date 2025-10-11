import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Check, Search, Filter, Repeat, ArrowRight, Receipt, X, Loader2, AlertCircle, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, isWithinInterval, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import { RecurrenceProgress } from "@/components/shared/RecurrenceProgress";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";
import DebtForm from "./DebtForm";
import { CardDebtsSection } from "./CardDebtsSection";
import { combineDebtsWithVirtualRecurrences, filterVirtualRecurrencesByPeriod, VirtualRecurrence } from "@/utils/recurrenceUtils";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Helper function to get status badge  
const getStatusBadge = (status: string, dueDate: string, isVirtual?: boolean, periodEnd?: Date) => {
  const comparisonDate = periodEnd || startOfDay(new Date());
  const due = startOfDay(parse(dueDate, 'yyyy-MM-dd', new Date()));
  const today = startOfDay(new Date());
  const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Para recorrências virtuais, sempre mostrar como pendente
  if (isVirtual) {
    if (daysDiff < 0) {
      return <Badge variant="destructive">
        Em Atraso ({Math.abs(daysDiff)} dias)
      </Badge>;
    } else if (daysDiff <= 3) {
      return <Badge variant="outline" className="text-orange-600 border-orange-200">
        Vence em {daysDiff} dias
      </Badge>;
    } else {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
        Faltam {daysDiff} dias
      </Badge>;
    }
  }
  
  let actualStatus = status;
  if (status === 'pending' && isBefore(due, comparisonDate)) {
    actualStatus = 'overdue';
  }
  
  switch (actualStatus) {
    case 'paid':
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Paga</Badge>;
    case 'overdue':
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Em Atraso ({Math.abs(daysDiff)} dias)
      </Badge>;
    case 'pending':
    default:
      if (daysDiff < 0) {
        return <Badge variant="destructive">
          Em Atraso ({Math.abs(daysDiff)} dias)
        </Badge>;
      } else if (daysDiff <= 3) {
        return <Badge variant="outline" className="text-orange-600 border-orange-200">
          Vence em {daysDiff} dias
        </Badge>;
      } else {
        return <Badge variant="secondary">
          Faltam {daysDiff} dias
        </Badge>;
      }
  }
};

// Helper function to get recurrence badge
const getRecurrenceBadge = (isRecurring: boolean, recurrenceType?: string) => {
  if (!isRecurring) return null;
  const typeLabels = {
    'weekly': 'Semanal',
    'monthly': 'Mensal',
    'yearly': 'Anual'
  };
  return <Badge variant="outline" className="flex items-center gap-1">
      <Repeat className="h-3 w-3" />
      {typeLabels[recurrenceType as keyof typeof typeLabels] || 'Recorrente'}
    </Badge>;
};
interface DebtListProps {
  categories?: Array<{ id: string; name: string; type: string }>;
  accounts?: Array<{ id: string; name: string; type: string }>;
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const DebtList: React.FC<DebtListProps> = ({
  categories: propCategories = [],
  accounts: propAccounts = [],
  currentMonth,
  onPreviousMonth,
  onNextMonth
}) => {
  const {
    user
  } = useSupabaseAuth();
  const {
    data: debts,
    loading,
    error,
    update,
    remove,
    refetch
  } = useSupabaseData('debts', user?.id);
  const {
    data: accounts
  } = useSupabaseData('accounts', user?.id);
  const {
    data: categories
  } = useSupabaseData('categories', user?.id);
  const {
    data: cards
  } = useSupabaseData('cards', user?.id);
  const {
    updateAccountBalance
  } = useBalanceUpdates();
  const {
    toast
  } = useToast();
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [debtForAccountSelection, setDebtForAccountSelection] = useState<any>(null);

  // Estados de loading para feedback visual
  const [loadingOperations, setLoadingOperations] = useState<{
    [key: string]: boolean;
  }>({});

  // Find default expense category
  const defaultExpenseCategory = categories.find(cat => cat.type === 'expense' && (cat.name.toLowerCase().includes('outros') || cat.name.toLowerCase().includes('despesa'))) || categories.find(cat => cat.type === 'expense');

  // Filter debts by current month and include virtual recurrences
  const filteredDebts = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Combinar dívidas reais com recorrências virtuais (6 meses à frente)
    const combinedDebts = combineDebtsWithVirtualRecurrences(debts, 6);
    
    return combinedDebts.filter(debt => {
      const dueDate = new Date(debt.due_date);
      return dueDate >= monthStart && dueDate <= monthEnd;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [debts, currentMonth]);

  // Calculate totals for filtered debts (excluding virtual recurrences)
  const totals = useMemo(() => {
    return filteredDebts.reduce((acc, debt) => {
      // Não incluir recorrências virtuais nos totais
      if ((debt as any).is_virtual) {
        return acc;
      }
      
      const due = new Date(debt.due_date);
      let actualStatus = debt.status;
      if (debt.status === 'pending' && due < new Date()) {
        actualStatus = 'overdue';
      }
      const amount = Number(debt.amount);
      if (!isNaN(amount) && isFinite(amount)) {
        acc[actualStatus] = (acc[actualStatus] || 0) + amount;
        acc.total += amount;
      }
      return acc;
    }, {
      pending: 0,
      paid: 0,
      overdue: 0,
      total: 0
    });
  }, [filteredDebts]);
  const handleMarkAsPaid = async (debt: any) => {
    const operationId = `mark-paid-${debt.id}`;
    try {
      // Iniciar loading
      setLoadingOperations(prev => ({
        ...prev,
        [operationId]: true
      }));

      // Validation: check if debt has an associated account
      if (!debt.account_id) {
        // Em vez de bloquear, oferecer opção de selecionar conta
        setDebtForAccountSelection(debt);
        setShowAccountSelector(true);
        return;
      }
      console.log('Starting to mark debt as paid:', debt.id);

      // Iniciar transação de banco de dados para rollback automático
      const {
        data: transactionData,
        error: transactionError
      } = await supabase.rpc('mark_debt_as_paid_with_rollback', {
        p_debt_id: debt.id,
        p_account_id: debt.account_id
      });
      if (transactionError) {
        console.error('Error in database transaction:', transactionError);
        throw new Error(`Erro na operação: ${transactionError.message}`);
      }
      console.log('Database transaction completed successfully');

      // Feedback de sucesso
      if (debt.is_recurring) {
        toast({
          title: "Sucesso",
          description: "Dívida recorrente marcada como paga, transação criada automaticamente e próxima ocorrência gerada!"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Dívida marcada como paga e transação criada automaticamente na aba Transações!"
        });
      }
      refetch();
    } catch (error) {
      console.error('Error in handleMarkAsPaid:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar dívida. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      // Finalizar loading
      setLoadingOperations(prev => ({
        ...prev,
        [operationId]: false
      }));
    }
  };
  const handleSelectAccountAndMarkAsPaid = async (accountId: string) => {
    if (!debtForAccountSelection) return;
    try {
      // Primeiro atualizar a dívida com a conta selecionada
      const updateResult = await update(debtForAccountSelection.id, {
        account_id: accountId
      });
      if (updateResult.error) {
        throw new Error(updateResult.error);
      }

      // Fechar seletor de conta
      setShowAccountSelector(false);
      setDebtForAccountSelection(null);

      // Agora marcar como paga com a conta selecionada
      const debtWithAccount = {
        ...debtForAccountSelection,
        account_id: accountId
      };
      await handleMarkAsPaid(debtWithAccount);
    } catch (error) {
      console.error('Error selecting account:', error);
      toast({
        title: "Erro",
        description: "Erro ao selecionar conta. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  const handleUnmarkAsPaid = async (debt: any) => {
    const operationId = `unmark-paid-${debt.id}`;
    try {
      // Iniciar loading
      setLoadingOperations(prev => ({
        ...prev,
        [operationId]: true
      }));
      console.log('Starting to unmark debt as paid:', debt.id);

      // Iniciar transação de banco de dados para rollback automático
      const {
        data: transactionData,
        error: transactionError
      } = await supabase.rpc('unmark_debt_as_paid_with_rollback', {
        p_debt_id: debt.id,
        p_account_id: debt.account_id
      });
      if (transactionError) {
        console.error('Error in database transaction:', transactionError);
        throw new Error(`Erro na operação: ${transactionError.message}`);
      }
      console.log('Database transaction completed successfully');
      toast({
        title: "Sucesso",
        description: "Dívida desmarcada como paga e transação removida!"
      });
      refetch();
    } catch (error) {
      console.error('Error in handleUnmarkAsPaid:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao desmarcar dívida. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      // Finalizar loading
      setLoadingOperations(prev => ({
        ...prev,
        [operationId]: false
      }));
    }
  };
  const handleDelete = async (debtId: string) => {
    const operationId = `delete-${debtId}`;
    try {
      // Iniciar loading
      setLoadingOperations(prev => ({
        ...prev,
        [operationId]: true
      }));
      const result = await remove(debtId);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: "Sucesso",
        description: "Dívida excluída com sucesso!"
      });
      refetch();
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir dívida. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      // Finalizar loading
      setLoadingOperations(prev => ({
        ...prev,
        [operationId]: false
      }));
    }
  };
  const handleFormSubmit = () => {
    setSelectedDebt(null);
    setShowForm(false);
    refetch();
  };
  const handleFormCancel = () => {
    setSelectedDebt(null);
    setShowForm(false);
  };
  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.name} - ${account.bank || 'Sem banco'}` : 'Conta não encontrada';
  };

  const getCardInfo = (cardId: string) => {
    const card = cards?.find(card => card.id === cardId);
    return card;
  };
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dívidas...</p>
        </div>
      </div>;
  }
  if (error) {
    return <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar dívidas: {error}</p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.overdue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Card Debts Section */}
      {/* Removido: CardDebtsSection - as dívidas de cartão agora aparecem integradas na lista principal */}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Dívidas a Pagar</CardTitle>
              
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium px-2">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <Button variant="outline" size="sm" onClick={onNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedDebt(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Dívida
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedDebt ? 'Editar Dívida' : 'Nova Dívida'}</DialogTitle>
                  </DialogHeader>
                  <DebtForm debt={selectedDebt} onClose={handleFormCancel} onSave={handleFormSubmit} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
        </CardHeader>
        
        <CardContent>
          {filteredDebts.length > 0 ? <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Cartão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDebts.map(debt => <TableRow key={debt.id}>
                      <TableCell className="font-medium">{debt.description}</TableCell>
                      <TableCell>{formatCurrency(Number(debt.amount))}</TableCell>
                      <TableCell>{format(parse(debt.due_date, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy", {
                    locale: ptBR
                  })}</TableCell>
                      <TableCell>
                        {debt.account_id ? <div className="flex items-center gap-1">
                            <Receipt className="h-3 w-3 text-green-600" />
                            {getAccountName(debt.account_id)}
                          </div> : <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Conta não especificada
                          </Badge>}
                      </TableCell>
                      <TableCell>
                        {debt.card_id ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getCardInfo(debt.card_id)?.color || '#3B82F6' }}
                            />
                            <span className="text-sm">
                              {getCardInfo(debt.card_id)?.name || 'Cartão não encontrado'}
                              {debt.is_card_bill && debt.bill_month && debt.bill_year && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({debt.bill_month}/{debt.bill_year})
                                </span>
                              )}
                              {debt.installment_id && debt.installment_number && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (Parcela {debt.installment_number})
                                </span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                       <TableCell>{getStatusBadge(debt.status, debt.due_date, (debt as any).is_virtual)}</TableCell>
                       <TableCell>
                         {(debt as any).is_virtual ? (
                           <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
                             <Repeat className="h-3 w-3" />
                             Recorrência #{(debt as any).occurrence_number}
                           </Badge>
                         ) : (
                           <RecurrenceProgress 
                             isRecurring={debt.is_recurring} 
                             recurrenceType={debt.recurrence_type} 
                             currentCount={debt.current_count || 0} 
                             maxOccurrences={debt.max_occurrences} 
                             endDate={debt.recurrence_end_date}
                           />
                         )}
                       </TableCell>
                      
                       <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-2">
                           {(debt as any).is_virtual ? (
                             <span className="text-xs text-muted-foreground">Recorrência futura</span>
                           ) : (
                             <>
                               {debt.status === 'pending' ? <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(debt)} disabled={loadingOperations[`mark-paid-${debt.id}`]} className="text-green-600 hover:text-green-700">
                                   {loadingOperations[`mark-paid-${debt.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                 </Button> : debt.status === 'paid' ? <Button variant="outline" size="sm" onClick={() => handleUnmarkAsPaid(debt)} disabled={loadingOperations[`unmark-paid-${debt.id}`]} className="text-orange-600 hover:text-orange-700">
                                   {loadingOperations[`unmark-paid-${debt.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                 </Button> : null}
                               
                               <Button variant="outline" size="sm" onClick={() => setSelectedDebt(debt)} disabled={Object.values(loadingOperations).some(Boolean)}>
                                 <Edit className="h-4 w-4" />
                               </Button>
                               
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                   <Button variant="outline" size="sm" disabled={Object.values(loadingOperations).some(Boolean)} className="text-red-600 hover:text-red-700">
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                   <AlertDialogHeader>
                                     <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                     <AlertDialogDescription>
                                       Tem certeza que deseja excluir a dívida "{debt.description}"? 
                                       Esta ação não pode ser desfeita.
                                     </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                     <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                     <AlertDialogAction onClick={() => handleDelete(debt.id)} className="bg-red-600 hover:bg-red-700">
                                       Excluir
                                     </AlertDialogAction>
                                   </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             </>
                           )}
                         </div>
                       </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div> : <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {debts.length === 0 ? "Nenhuma dívida cadastrada. Comece adicionando sua primeira dívida!" : "Nenhuma dívida encontrada com os filtros aplicados."}
              </p>
              {debts.length === 0 && <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Dívida
                </Button>}
            </div>}
        </CardContent>
      </Card>

      {/* Account Selector Dialog */}
      <Dialog open={showAccountSelector} onOpenChange={setShowAccountSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Conta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Esta dívida não possui uma conta associada. Selecione uma conta para permitir a geração automática de transações.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Conta para débito:</label>
              <Select onValueChange={handleSelectAccountAndMarkAsPaid}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map(account => <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.bank || 'Sem banco'}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAccountSelector(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default DebtList;