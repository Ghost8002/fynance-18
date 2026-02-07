import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Check, Search, Repeat, Receipt, X, Loader2, AlertCircle, ChevronLeft, ChevronRight, Tag, Clock, CheckCircle, AlertTriangle, TrendingUp, CalendarDays } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, isWithinInterval, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { useReceivablesWithTags } from "@/hooks/useReceivablesWithTags";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import { RecurrenceProgress } from "@/components/shared/RecurrenceProgress";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";
import ReceivableForm from "./ReceivableForm";
import { combineDebtsWithVirtualRecurrences, VirtualRecurrence } from "@/utils/recurrenceUtils";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Helper function to get status badge
const getStatusBadge = (status: string, dueDate: string, isVirtual?: boolean) => {
  const today = startOfDay(new Date());
  const due = startOfDay(parse(dueDate, 'yyyy-MM-dd', new Date()));
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
  if (status === 'pending' && isBefore(due, today)) {
    actualStatus = 'overdue';
  }
  
  switch (actualStatus) {
    case 'received':
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Recebido</Badge>;
    case 'overdue':
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Em Atraso ({Math.abs(daysDiff)} dias)
      </Badge>;
    case 'pending':
    default:
      if (daysDiff <= 3 && daysDiff >= 0) {
        return <Badge variant="outline" className="text-orange-600 border-orange-200">
          Vence em {daysDiff} dias
        </Badge>;
      } else if (daysDiff < 0) {
        return <Badge variant="destructive">
          Em Atraso ({Math.abs(daysDiff)} dias)
        </Badge>;
      } else {
        return <Badge variant="secondary">Pendente</Badge>;
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

// Helper function to get category name
const getCategoryName = (categoryId: string, categories: any[]) => {
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.name : 'Categoria não encontrada';
};

// Helper function to get category color
const getCategoryColor = (categoryId: string, categories: any[]) => {
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.color : '#3B82F6';
};

// Helper function to get subcategory name
const getSubcategoryName = (subcategoryId: string, subcategories: any[]) => {
  const subcategory = subcategories.find(sub => sub.id === subcategoryId);
  return subcategory ? subcategory.name : '';
};

// Helper function to get subcategory color
const getSubcategoryColor = (subcategoryId: string, subcategories: any[]) => {
  const subcategory = subcategories.find(sub => sub.id === subcategoryId);
  return subcategory ? subcategory.color : '#9CA3AF';
};

interface ReceivableListProps {
  categories?: Array<{ id: string; name: string; type: string }>;
  accounts?: Array<{ id: string; name: string; type: string }>;
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onGoToToday?: () => void;
}

const ReceivableList: React.FC<ReceivableListProps> = ({
  categories: propCategories = [],
  accounts: propAccounts = [],
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onGoToToday
}) => {
  const {
    user
  } = useSupabaseAuth();
  const {
    data: receivables,
    loading,
    error,
    refetch
  } = useReceivablesWithTags();
  const {
    data: accounts
  } = useRealtimeData('accounts');
  const {
    data: categories
  } = useRealtimeData('categories');
  const {
    data: subcategories
  } = useRealtimeData('subcategories');
  const {
    data: tags
  } = useRealtimeData('tags');
  const {
    updateAccountBalance
  } = useBalanceUpdates();
  const {
    toast
  } = useToast();
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

  // Filter receivables by current month and include virtual recurrences
  const filteredReceivables = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Combinar recebíveis reais com recorrências virtuais (6 meses à frente)
    const combinedReceivables = combineDebtsWithVirtualRecurrences(receivables, 6);
    
    return combinedReceivables.filter(receivable => {
      const dueDate = new Date(receivable.due_date);
      return dueDate >= monthStart && dueDate <= monthEnd;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [receivables, currentMonth]);

  // Funções de atualização e remoção
  const update = async (id: string, updateData: any) => {
    try {
      const { data: result, error } = await supabase
        .from('receivable_payments' as any)
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      refetch();
      return { data: result, error: null };
    } catch (err) {
      console.error('Error updating receivable:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      return { data: null, error: errorMessage };
    }
  };

  const remove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('receivable_payments' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      refetch();
      return { error: null };
    } catch (err) {
      console.error('Error deleting receivable:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      return { error: errorMessage };
    }
  };

  // Carregar tags para os recebíveis
  useEffect(() => {
    if (receivables.length > 0 && user?.id) {
      const fetchReceivableTags = async () => {
        // Buscar todas as associações de tags para os recebíveis
        const { data: receivableTagsData, error: receivableTagsError } = await supabase
          .from('receivable_payment_tags' as any)
          .select('*')
          .in('receivable_payment_id', receivables.map(r => r.id));
        
        if (receivableTagsError) {
          console.error('Error fetching receivable tags:', receivableTagsError);
          return;
        }
        
        // Buscar os detalhes das tags
        if (receivableTagsData && receivableTagsData.length > 0) {
          const tagIds = [...new Set((receivableTagsData as any[]).map((rpt: any) => rpt.tag_id))];
          const { data: tagsData, error: tagsError } = await supabase
            .from('tags' as any)
            .select('*')
            .in('id', tagIds);
          
          if (tagsError) {
            console.error('Error fetching tags:', tagsError);
            return;
          }
          
          // Mapear tags para cada recebível
          const updatedReceivables = receivables.map(receivable => {
            const receivableTagIds = (receivableTagsData as any[])
              .filter((rpt: any) => rpt.receivable_payment_id === receivable.id)
              .map((rpt: any) => rpt.tag_id);
            
            const receivableTags = (tagsData as any[])?.filter((tag: any) => receivableTagIds.includes(tag.id)) || [];
            
            return {
              ...receivable,
              tags: receivableTags
            };
          });
          
          // Atualizar os dados dos recebíveis com as tags
          // Aqui precisamos atualizar o estado do hook useSupabaseData de alguma forma
          // Por enquanto, vamos atualizar o estado local
        }
      };
      
      fetchReceivableTags();
    }
  }, [receivables, user?.id]);

  // Calculate totals for filtered receivables (excluding virtual recurrences)
  const totals = useMemo(() => {
    return filteredReceivables.reduce((acc, receivable) => {
      // Não incluir recorrências virtuais nos totais
      if ((receivable as any).is_virtual) {
        return acc;
      }
      
      const due = new Date(receivable.due_date);
      let actualStatus = receivable.status;
      if (receivable.status === 'pending' && due < new Date()) {
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

  // Helper function to get tags display
  const getTagsDisplay = (receivable: any) => {
    // Verificar se receivable.tags existe e é um array
    if (!receivable.tags || !Array.isArray(receivable.tags) || receivable.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {receivable.tags.map((tag: any) => {
          // Agora tag é um objeto completo, não apenas um ID
          return (
            <Badge 
              key={tag.id} 
              variant="secondary" 
              className="text-xs py-0.5 px-1.5"
              style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}
            >
              <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </Badge>
          );
        })}
      </div>
    );
  };

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
      } = await supabase.rpc('mark_receivable_as_received_with_rollback' as any, {
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
      } = await supabase.rpc('unmark_receivable_as_received_with_rollback' as any, {
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
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards - Grid 2x2 no mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="border-t-2 border-t-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-base sm:text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-t-2 border-t-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Recebido</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-base sm:text-2xl font-bold text-green-600">{formatCurrency(totals.received)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-t-2 border-t-red-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-base sm:text-2xl font-bold text-red-600">{formatCurrency(totals.overdue)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-t-2 border-t-primary hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Geral</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-base sm:text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-xl">A Receber</CardTitle>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={() => setSelectedReceivable(null)}>
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Novo Pagamento</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedReceivable ? 'Editar Pagamento' : 'Novo Pagamento'}</DialogTitle>
                  </DialogHeader>
                  <ReceivableForm receivable={selectedReceivable} onClose={handleFormCancel} onSave={handleFormSubmit} />
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex items-center justify-center gap-2 bg-muted/50 rounded-lg py-1.5 px-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm sm:text-base font-semibold min-w-[120px] sm:min-w-[160px] text-center capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {onGoToToday && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs ml-1"
                  onClick={onGoToToday}
                >
                  <CalendarDays className="h-3 w-3 mr-1" />
                  Hoje
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredReceivables.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.map((receivable: any) => (
                    <TableRow 
                      key={receivable.id}
                      className={
                        receivable.status === 'received' 
                          ? 'border-l-4 border-l-green-500' 
                          : receivable.status === 'pending' && new Date(receivable.due_date) < new Date() 
                            ? 'border-l-4 border-l-red-500 bg-red-500/5' 
                            : receivable.status === 'pending' 
                              ? 'border-l-4 border-l-yellow-500' 
                              : ''
                      }
                    >
                      <TableCell className="font-medium">
                        <div>{receivable.description}</div>
                        {getTagsDisplay(receivable)}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(receivable.amount))}</TableCell>
                      <TableCell>
                        {format(parse(receivable.due_date, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy", {
                          locale: ptBR
                        })}
                      </TableCell>
                      <TableCell>
                        {receivable.account_id ? (
                          <div className="flex items-center gap-1">
                            <Receipt className="h-3 w-3 text-green-600" />
                            {getAccountName(receivable.account_id)}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Conta não especificada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {receivable.category_id && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{ backgroundColor: `${getCategoryColor(receivable.category_id, categories)}20`, borderColor: getCategoryColor(receivable.category_id, categories), color: getCategoryColor(receivable.category_id, categories) }}
                            >
                              <div
                                className="w-2 h-2 rounded-full mr-1"
                                style={{ backgroundColor: getCategoryColor(receivable.category_id, categories) }}
                              />
                              {getCategoryName(receivable.category_id, categories)}
                            </Badge>
                          )}
                          {/* Verificar se é um objeto real e não uma recorrência virtual */}
                          {receivable.subcategory_id && typeof receivable.subcategory_id === 'string' && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: getSubcategoryColor(receivable.subcategory_id, subcategories), color: getSubcategoryColor(receivable.subcategory_id, subcategories) }}
                            >
                              <div
                                className="w-2 h-2 rounded-full mr-1"
                                style={{ backgroundColor: getSubcategoryColor(receivable.subcategory_id, subcategories) }}
                              />
                              {getSubcategoryName(receivable.subcategory_id, subcategories)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receivable.status, receivable.due_date, receivable.is_virtual)}
                      </TableCell>
                      <TableCell>
                        {(receivable as any).is_virtual ? (
                          <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
                            <Repeat className="h-3 w-3" />
                            Recorrência #{(receivable as any).occurrence_number}
                          </Badge>
                        ) : (
                          getTagsDisplay(receivable)
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           {!(receivable as any).is_virtual ? (
                            <>
                              {((receivable as any).status === 'pending' || (receivable as any).status === 'overdue') && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleMarkAsReceived(receivable as any)} 
                                  disabled={loadingOperations[`mark-received-${(receivable as any).id}`]} 
                                  className="text-green-600 hover:text-green-700"
                                >
                                  {loadingOperations[`mark-received-${(receivable as any).id}`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              
                              {(receivable as any).status === 'received' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleUnmarkAsReceived(receivable as any)} 
                                  disabled={loadingOperations[`unmark-received-${(receivable as any).id}`]} 
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  {loadingOperations[`unmark-received-${(receivable as any).id}`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedReceivable(receivable)} 
                                disabled={Object.values(loadingOperations).some(Boolean)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={Object.values(loadingOperations).some(Boolean)} 
                                    className="text-red-600 hover:text-red-700"
                                  >
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
                                     <AlertDialogAction 
                                       onClick={() => handleDelete(receivable.id)} 
                                       className="bg-red-600 hover:bg-red-700"
                                     >
                                       Excluir
                                     </AlertDialogAction>
                                   </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             </>
                           ) : (
                             <span className="text-xs text-muted-foreground">Recorrência futura</span>
                           )}
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {receivables.length === 0 ? "Nenhum pagamento cadastrado. Comece adicionando seu primeiro pagamento!" : "Nenhum pagamento encontrado com os filtros aplicados."}
              </p>
              {receivables.length === 0 && <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Pagamento
                </Button>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Selector Dialog */}
      <Dialog open={showAccountSelector} onOpenChange={setShowAccountSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Conta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
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
    </div>
  );
};

export default ReceivableList;