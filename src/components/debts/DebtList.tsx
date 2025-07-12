import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Check, Search, Filter, Repeat, ArrowRight, Receipt, X } from "lucide-react";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import { supabase } from "@/integrations/supabase/client";
import DebtForm from "./DebtForm";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
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
    case 'paid':
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Paga</Badge>;
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
  
  const typeMap = {
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual'
  };
  
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      <Repeat className="h-3 w-3 mr-1" />
      {typeMap[recurrenceType as keyof typeof typeMap] || 'Recorrente'}
    </Badge>
  );
};

const DebtList: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { data: debts, loading, error, update, remove, refetch } = useSupabaseData('debts', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { insert: insertTransaction } = useSupabaseData('transactions', user?.id);
  const { updateAccountBalance } = useBalanceUpdates();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  // Find default expense category
  const defaultExpenseCategory = categories.find(cat => 
    cat.type === 'expense' && (cat.name.toLowerCase().includes('outros') || cat.name.toLowerCase().includes('despesa'))
  ) || categories.find(cat => cat.type === 'expense');

  // Filter and search debts
  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      const matchesSearch = debt.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      
      const today = startOfDay(new Date());
      const due = startOfDay(new Date(debt.due_date));
      let actualStatus = debt.status;
      
      if (debt.status === 'pending' && isBefore(due, today)) {
        actualStatus = 'overdue';
      }
      
      return matchesSearch && actualStatus === statusFilter;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [debts, searchTerm, statusFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const today = startOfDay(new Date());
    
    return debts.reduce((acc, debt) => {
      const due = startOfDay(new Date(debt.due_date));
      let actualStatus = debt.status;
      
      if (debt.status === 'pending' && isBefore(due, today)) {
        actualStatus = 'overdue';
      }
      
      acc[actualStatus] = (acc[actualStatus] || 0) + Number(debt.amount);
      acc.total += Number(debt.amount);
      
      return acc;
    }, { pending: 0, paid: 0, overdue: 0, total: 0 });
  }, [debts]);

  const createTransactionFromDebt = async (debt: any) => {
    try {
      // Validation: check if debt has an associated account
      if (!debt.account_id) {
        throw new Error("Esta dívida não possui uma conta associada. Não é possível gerar a transação automaticamente.");
      }

      // Create transaction data
      const transactionData = {
        user_id: user?.id,
        type: 'expense' as const,
        description: debt.description,
        amount: -Math.abs(Number(debt.amount)), // Negative for expenses
        date: format(new Date(), 'yyyy-MM-dd'),
        category_id: defaultExpenseCategory?.id || null,
        account_id: debt.account_id,
        card_id: null,
        notes: `Transação gerada automaticamente a partir da dívida paga. Data de vencimento original: ${format(new Date(debt.due_date), "dd/MM/yyyy", { locale: ptBR })}${debt.is_recurring ? ` (Dívida recorrente - ${debt.recurrence_type === 'weekly' ? 'Semanal' : debt.recurrence_type === 'monthly' ? 'Mensal' : 'Anual'})` : ''}`
      };

      console.log('Creating transaction from debt:', transactionData);

      // Insert transaction
      const transactionResult = await insertTransaction(transactionData);

      if (transactionResult.error) {
        throw new Error(`Erro ao criar transação: ${transactionResult.error}`);
      }

      console.log('Transaction created successfully:', transactionResult.data);
      return transactionResult.data;

    } catch (error) {
      console.error('Error creating transaction from debt:', error);
      throw error;
    }
  };

  const handleMarkAsPaid = async (debt: any) => {
    try {
      // Validation: check if debt has an associated account
      if (!debt.account_id) {
        toast({
          title: "Erro",
          description: "Esta dívida não possui uma conta associada. Selecione uma conta antes de marcar como paga.",
          variant: "destructive",
        });
        return;
      }

      console.log('Starting to mark debt as paid:', debt.id);

      // Create transaction first
      const transaction = await createTransactionFromDebt(debt);
      console.log('Transaction created, now updating debt status');

      // Update debt status
      const result = await update(debt.id, {
        status: 'paid',
        paid_date: format(new Date(), 'yyyy-MM-dd'),
      });

      if (result.error) {
        console.error('Error updating debt status:', result.error);
        throw new Error(result.error);
      }

      console.log('Debt status updated successfully');

      // Update account balance (subtract for expense)
      await updateAccountBalance(debt.account_id, -Math.abs(Number(debt.amount)), 'expense');
      console.log('Account balance updated');

      // Handle recurring debt
      if (debt.is_recurring) {
        const { error: functionError } = await supabase.rpc('create_next_recurring_debt', {
          debt_id: debt.id
        });

        if (functionError) {
          console.error('Error creating next recurring debt:', functionError);
          toast({
            title: "Atenção",
            description: "Dívida marcada como paga e transação criada, mas houve erro ao criar a próxima recorrência.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sucesso",
            description: "Dívida recorrente marcada como paga, transação criada automaticamente e próxima ocorrência gerada!",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Dívida marcada como paga e transação criada automaticamente na aba Transações!",
        });
      }

      refetch();
    } catch (error) {
      console.error('Error in handleMarkAsPaid:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar dívida. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUnmarkAsPaid = async (debt: any) => {
    try {
      console.log('Starting to unmark debt as paid:', debt.id);

      // Find and delete the associated transaction
      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('account_id', debt.account_id)
        .eq('amount', -Math.abs(Number(debt.amount)))
        .like('description', `%${debt.description}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching transaction:', fetchError);
        throw new Error('Erro ao buscar transação associada');
      }

      if (transactions && transactions.length > 0) {
        const transaction = transactions[0];
        
        // Delete the transaction
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transaction.id);

        if (deleteError) {
          console.error('Error deleting transaction:', deleteError);
          throw new Error('Erro ao excluir transação');
        }

        // Update account balance (add back the amount)
        await updateAccountBalance(debt.account_id, Math.abs(Number(debt.amount)), 'income');
        console.log('Account balance updated');
      }

      // Update debt status back to pending
      const result = await update(debt.id, {
        status: 'pending',
        paid_date: null,
      });

      if (result.error) {
        console.error('Error updating debt status:', result.error);
        throw new Error(result.error);
      }

      toast({
        title: "Sucesso",
        description: "Dívida desmarcada como paga e transação removida!",
      });

      refetch();
    } catch (error) {
      console.error('Error in handleUnmarkAsPaid:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao desmarcar dívida. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (debtId: string) => {
    try {
      const result = await remove(debtId);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Sucesso",
        description: "Dívida excluída com sucesso!",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir dívida. Tente novamente.",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dívidas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar dívidas: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Dívidas a Pagar</CardTitle>
              <CardDescription>Gerencie suas dívidas - transações são geradas automaticamente ao marcar como paga</CardDescription>
            </div>
            
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
                <DebtForm
                  debt={selectedDebt}
                  onClose={handleFormCancel}
                  onSave={handleFormSubmit}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar dívidas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Paga</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredDebts.length > 0 ? (
            <div className="rounded-md border">
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
                  {filteredDebts.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium">{debt.description}</TableCell>
                      <TableCell>{formatCurrency(Number(debt.amount))}</TableCell>
                      <TableCell>{format(new Date(debt.due_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        {debt.account_id ? (
                          <div className="flex items-center gap-1">
                            <Receipt className="h-3 w-3 text-green-600" />
                            {getAccountName(debt.account_id)}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Conta não especificada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(debt.status, debt.due_date)}</TableCell>
                      <TableCell>{getRecurrenceBadge(debt.is_recurring, debt.recurrence_type)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {debt.status !== 'paid' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsPaid(debt)}
                              className="text-green-600 hover:text-green-700"
                              title={debt.is_recurring ? "Marcar como paga e gerar próxima recorrência" : "Marcar como paga e criar transação"}
                            >
                              {debt.is_recurring ? <ArrowRight className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnmarkAsPaid(debt)}
                              className="text-red-600 hover:text-red-700"
                              title="Desmarcar como paga e remover transação"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Dialog open={showForm && selectedDebt?.id === debt.id} onOpenChange={(open) => {
                            if (!open) {
                              setSelectedDebt(null);
                              setShowForm(false);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDebt(debt);
                                  setShowForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Editar Dívida</DialogTitle>
                              </DialogHeader>
                              <DebtForm
                                debt={selectedDebt}
                                onClose={handleFormCancel}
                                onSave={handleFormSubmit}
                              />
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(debt.id)}>
                                  Excluir
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
          ) : (
            <div className="text-center py-8">
              <Plus size={48} className="text-muted-foreground mb-4 mx-auto" />
              <p className="text-muted-foreground mb-4">Nenhuma dívida encontrada</p>
              <Button onClick={() => setShowForm(true)}>
                Adicionar Primeira Dívida
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DebtList;
