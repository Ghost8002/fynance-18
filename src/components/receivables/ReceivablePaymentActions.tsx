import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Edit, Trash2, Repeat, Loader2, AlertCircle } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ReceivablePaymentActionsProps {
  payment: any;
  onEdit: (payment: any) => void;
  onRefresh: () => void;
}

const ReceivablePaymentActions = ({ payment, onEdit, onRefresh }: ReceivablePaymentActionsProps) => {
  const { user } = useAuth();
  const { update, remove } = useSupabaseData('receivable_payments', user?.id);
  const [loadingOperations, setLoadingOperations] = useState<{[key: string]: boolean}>({});

  const handleMarkAsReceived = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    const operationId = `mark-received-${payment.id}`;
    setLoadingOperations(prev => ({ ...prev, [operationId]: true }));

    try {
      // Usar a nova função de rollback
      const { data, error } = await supabase.rpc('mark_receivable_as_received_with_rollback' as any, {
        p_payment_id: payment.id,
        p_user_id: user.id,
        p_amount: payment.amount,
        p_description: payment.description,
        p_account_id: payment.account_id,
        p_category_id: payment.category_id,
        p_is_recurring: payment.is_recurring,
        p_recurrence_type: payment.recurrence_type,
        p_due_date: payment.due_date
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && !(data as any).success) {
        throw new Error((data as any).message || 'Erro ao processar pagamento');
      }

      // Feedback de sucesso
      if (payment.is_recurring) {
        toast.success('Pagamento marcado como recebido e próximo pagamento criado!');
      } else {
        toast.success('Pagamento marcado como recebido e transação criada!');
      }

      onRefresh();
    } catch (error: any) {
      console.error('Erro ao marcar pagamento como recebido:', error);
      toast.error(error.message || 'Erro ao marcar pagamento como recebido');
    } finally {
      setLoadingOperations(prev => ({ ...prev, [operationId]: false }));
    }
  };

  const handleUnmarkAsReceived = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    const operationId = `unmark-received-${payment.id}`;
    setLoadingOperations(prev => ({ ...prev, [operationId]: true }));

    try {
      // Usar a nova função de rollback
      const { data, error } = await supabase.rpc('unmark_receivable_as_received_with_rollback' as any, {
        p_payment_id: payment.id,
        p_user_id: user.id,
        p_amount: payment.amount,
        p_description: payment.description,
        p_account_id: payment.account_id
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && !(data as any).success) {
        throw new Error((data as any).message || 'Erro ao processar pagamento');
      }

      toast.success('Pagamento desmarcado como recebido!');
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao desmarcar pagamento como recebido:', error);
      toast.error(error.message || 'Erro ao desmarcar pagamento como recebido');
    } finally {
      setLoadingOperations(prev => ({ ...prev, [operationId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) {
      return;
    }

    const operationId = `delete-${payment.id}`;
    setLoadingOperations(prev => ({ ...prev, [operationId]: true }));

    try {
      const result = await remove(payment.id);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Pagamento excluído com sucesso!');
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao excluir pagamento:', error);
      toast.error('Erro ao excluir pagamento');
    } finally {
      setLoadingOperations(prev => ({ ...prev, [operationId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received':
        return 'Recebido';
      case 'overdue':
        return 'Vencido';
      default:
        return 'Pendente';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="font-medium text-foreground">
            {payment.description}
          </h3>
          <Badge className={getStatusColor(payment.status)}>
            {getStatusLabel(payment.status)}
          </Badge>
          {payment.is_recurring && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Repeat className="h-3 w-3" />
              {payment.recurrence_type === 'monthly' ? 'Mensal' : 
               payment.recurrence_type === 'weekly' ? 'Semanal' : 'Anual'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Vencimento: {format(new Date(payment.due_date), 'dd/MM/yyyy')}
          </div>
          {payment.received_date && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Recebido: {format(new Date(payment.received_date), 'dd/MM/yyyy')}
            </div>
          )}
        </div>
        
        {payment.notes && (
          <p className="text-sm text-muted-foreground mt-2">
            {payment.notes}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {payment.status === 'pending' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsReceived}
            disabled={Object.values(loadingOperations).some(Boolean)}
            className="text-green-600 hover:text-green-700"
          >
            {loadingOperations[`mark-received-${payment.id}`] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span className="ml-1">Marcar como Recebido</span>
          </Button>
        ) : payment.status === 'received' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnmarkAsReceived}
            disabled={Object.values(loadingOperations).some(Boolean)}
            className="text-orange-600 hover:text-orange-700"
          >
            {loadingOperations[`unmark-received-${payment.id}`] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span className="ml-1">Desmarcar</span>
          </Button>
        ) : null}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(payment)}
          disabled={Object.values(loadingOperations).some(Boolean)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={Object.values(loadingOperations).some(Boolean)}
          className="text-red-600 hover:text-red-700"
        >
          {loadingOperations[`delete-${payment.id}`] ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReceivablePaymentActions;
