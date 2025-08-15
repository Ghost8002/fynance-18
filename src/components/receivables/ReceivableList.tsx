import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Check, Search, Repeat, Receipt, X, Loader2, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import { usePeriodFilterContext } from "@/context/PeriodFilterContext";
import { RecurrenceProgress } from "@/components/shared/RecurrenceProgress";
import { supabase } from "@/integrations/supabase/client";
import ReceivableForm from "./ReceivableForm";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Helper function to get status badge
const getStatusBadge = (status: string, dueDate: string) => {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  let actualStatus = status;
  if (status === 'pending' && isBefore(due, today)) {
    actualStatus = 'overdue';
  }
  switch (actualStatus) {
    case 'received':
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Recebido</Badge>;
    case 'overdue':
      return <Badge variant="destructive">Em Atraso</Badge>;
    case 'pending':
    default:
      return <Badge variant="secondary">Pendente</Badge>;
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
const ReceivableList: React.FC = () => {
  const {
    user
  } = useSupabaseAuth();
  const {
    data: receivables,
    loading,
    error,
    update,
    remove,
    refetch
  } = useSupabaseData('receivable_payments', user?.id);
  const {
    data: accounts
  } = useSupabaseData('accounts', user?.id);
  const {
    data: categories
  } = useSupabaseData('categories', user?.id);
  const {
    updateAccountBalance
  } = useBalanceUpdates();
  const {
    dateRange
  } = usePeriodFilterContext();
  const {
    toast
  } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReceivable, setSelectedReceivable] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [receivableForAccountSelection, setReceivableForAccountSelection] = useState<any>(null);

  // Estados de loading para feedback visual
  const [loadingOperations, setLoadingOperations] = useState<{
    [key: string]: boolean;
  }>({});

  // Find default income category
  const defaultIncomeCategory = categories.find(cat => cat.type === 'income' && (cat.name.toLowerCase().includes('outros') || cat.name.toLowerCase().includes('receita'))) || categories.find(cat => cat.type === 'income');

  // Filter and search receivables
  const filteredReceivables = useMemo(() => {
    return receivables.filter(receivable => {
      // Period filter
      const dueDate = startOfDay(new Date(receivable.due_date));
      const withinPeriod = isWithinInterval(dueDate, {
        start: dateRange.startDate,
        end: dateRange.endDate
      });
      if (!withinPeriod) return false;

      // Search filter
      const matchesSearch = receivable.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (statusFilter === 'all') return matchesSearch;

      // Status filter
      const today = startOfDay(new Date());
      const due = startOfDay(new Date(receivable.due_date));
      let actualStatus = receivable.status;
      if (receivable.status === 'pending' && isBefore(due, today)) {
        actualStatus = 'overdue';
      }
      return matchesSearch && actualStatus === statusFilter;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [receivables, searchTerm, statusFilter, dateRange]);

  // Calculate totals for filtered receivables
  const totals = useMemo(() => {
    const today = startOfDay(new Date());
    return filteredReceivables.reduce((acc, receivable) => {
      const due = startOfDay(new Date(receivable.due_date));
      let actualStatus = receivable.status;
      if (receivable.status === 'pending' && isBefore(due, today)) {
        actualStatus = 'overdue';
      }
      const amount = Number(receivable.amount);
      if (!isNaN(amount) && isFinite(amount)) {
        acc[actualStatus] = (acc[actualStatus] || 0) + amount;
        acc.total += amount;
      }
      return acc;
    }, {
      pending: 0,
      received: 0,
      overdue: 0,
      total: 0
    });
  }, [filteredReceivables]);
  const handleMarkAsReceived = async (receivable: any) => {
    const operationId = `mark-received-${receivable.id}`;
    try {
      // Iniciar loading
      setLoadingOperations(prev => ({
        ...prev,
        [operationId]: true
      }));

      // Validation: check if receivable has an associated account
      if (!receivable.account_id) {
        // Em vez de bloquear, oferecer opção de selecionar conta
        setReceivableForAccountSelection(receivable);
        setShowAccountSelector(true);
        return;
      }
      console.log('Starting to mark receivable as received:', receivable.id);

      // Iniciar transação de banco de dados para rollback automático
      const {
        data: transactionData,
        error: transactionError
      } = await supabase.rpc('mark_receivable_as_received_with_rollback', {
        p_receivable_id: receivable.id,
        p_account_id: receivable.account_id
      });
      if (transactionError) {
        console.error('Error in database transaction:', transactionError);
        throw new Error(`Erro na operação: ${transactionError.message}`);
      }
      console.log('Database transaction completed successfully');

      // Feedback de sucesso
      if (receivable.is_recurring) {
        toast({
          title: "Sucesso",
          description: "Pagamento recorrente marcado como recebido, transação criada automaticamente e próxima ocorrência gerada!"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Pagamento marcado como recebido e transação criada automaticamente na aba Transações!"
        });
      }
      refetch();
    } catch (error) {
      console.error('Error in handleMarkAsReceived:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar pagamento. Tente novamente.",
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
  const handleSelectAccountAndMarkAsReceived = async (accountId: string) => {
    if (!receivableForAccountSelection) return;
    try {
      // Primeiro atualizar o pagamento com a conta selecionada
      const updateResult = await update(receivableForAccountSelection.id, {
        account_id: accountId
      });
      if (updateResult.error) {
        throw new Error(updateResult.error);
      }

      // Fechar seletor de conta
      setShowAccountSelector(false);
      setReceivableForAccountSelection(null);

      // Agora marcar como recebido com a conta selecionada
      const receivableWithAccount = {
        ...receivableForAccountSelection,
        account_id: accountId
      };
      await handleMarkAsReceived(receivableWithAccount);
    } catch (error) {
      console.error('Error selecting account:', error);
      toast({
        title: "Erro",
        description: "Erro ao selecionar conta. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  const handleUnmarkAsReceived = async (receivable: any) => {
    const operationId = `unmark-received-${receivable.id}`;
    try {
      // Iniciar loading
      setLoadingOperations(prev => ({
        ...prev,
        [operationId]: true
      }));
      console.log('Starting to unmark receivable as received:', receivable.id);

      // Iniciar transação de banco de dados para rollback automático
      const {
        data: transactionData,
        error: transactionError
      } = await supabase.rpc('unmark_receivable_as_received_with_rollback', {
        p_receivable_id: receivable.id,
        p_account_id: receivable.account_id
      });
      if (transactionError) {
        console.error('Error in database transaction:', transactionError);
        throw new Error(`Erro na operação: ${transactionError.message}`);
      }
      console.log('Database transaction completed successfully');
      toast({
        title: "Sucesso",
        description: "Pagamento desmarcado como recebido e transação removida!"
      });
      refetch();
    } catch (error) {
      console.error('Error in handleUnmarkAsReceived:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao desmarcar pagamento. Tente novamente.",
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
  const handleDelete = async (receivableId: string) => {
    const operationId = `delete-${receivableId}`;
    try {
      // Iniciar loading
      setLoadingOperations(prev => ({
        ...prev,
        [operationId]: true
      }));
      const result = await remove(receivableId);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso!"
      });
      refetch();
    } catch (error) {
      console.error('Error deleting receivable:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir pagamento. Tente novamente.",
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
    setSelectedReceivable(null);
    setShowForm(false);
    refetch();
  };
  const handleFormCancel = () => {
    setSelectedReceivable(null);
    setShowForm(false);
  };
  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.name} - ${account.bank || 'Sem banco'}` : 'Conta não encontrada';
  };
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando pagamentos...</p>
        </div>
      </div>;
  }
  if (error) {
    return <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar pagamentos: {error}</p>
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
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.received)}</div>
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

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Pagamentos a Receber</CardTitle>
              
            </div>
            
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedReceivable(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedReceivable ? 'Editar Pagamento' : 'Novo Pagamento'}</DialogTitle>
                </DialogHeader>
                <ReceivableForm receivable={selectedReceivable} onClose={handleFormCancel} onSave={handleFormSubmit} />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar pagamentos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="received">Recebidos</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredReceivables.length > 0 ? <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.map(receivable => <TableRow key={receivable.id}>
                      <TableCell className="font-medium">{receivable.description}</TableCell>
                      <TableCell>{formatCurrency(Number(receivable.amount))}</TableCell>
                      <TableCell>{format(new Date(receivable.due_date), "dd/MM/yyyy", {
                    locale: ptBR
                  })}</TableCell>
                      <TableCell>
                        {receivable.account_id ? <div className="flex items-center gap-1">
                            <Receipt className="h-3 w-3 text-green-600" />
                            {getAccountName(receivable.account_id)}
                          </div> : <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Conta não especificada
                          </Badge>}
                      </TableCell>
                      <TableCell>{getStatusBadge(receivable.status, receivable.due_date)}</TableCell>
                      <TableCell>
                        <RecurrenceProgress isRecurring={receivable.is_recurring} recurrenceType={receivable.recurrence_type} currentCount={receivable.current_count || 0} maxOccurrences={receivable.max_occurrences} endDate={receivable.recurrence_end_date} />
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {receivable.status === 'pending' ? <Button variant="outline" size="sm" onClick={() => handleMarkAsReceived(receivable)} disabled={loadingOperations[`mark-received-${receivable.id}`]} className="text-green-600 hover:text-green-700">
                              {loadingOperations[`mark-received-${receivable.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button> : receivable.status === 'received' ? <Button variant="outline" size="sm" onClick={() => handleUnmarkAsReceived(receivable)} disabled={loadingOperations[`unmark-received-${receivable.id}`]} className="text-orange-600 hover:text-orange-700">
                              {loadingOperations[`unmark-received-${receivable.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            </Button> : null}
                          
                          <Button variant="outline" size="sm" onClick={() => setSelectedReceivable(receivable)} disabled={Object.values(loadingOperations).some(Boolean)}>
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
                                  Tem certeza que deseja excluir o pagamento "{receivable.description}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(receivable.id)} className="bg-red-600 hover:bg-red-700">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div> : <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {receivables.length === 0 ? "Nenhum pagamento cadastrado. Comece adicionando seu primeiro pagamento!" : "Nenhum pagamento encontrado com os filtros aplicados."}
              </p>
              {receivables.length === 0 && <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Pagamento
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
                Este pagamento não possui uma conta associada. Selecione uma conta para permitir a geração automática de transações.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Conta para crédito:</label>
              <Select onValueChange={handleSelectAccountAndMarkAsReceived}>
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
export default ReceivableList;