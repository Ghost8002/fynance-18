
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Edit, Trash2, Repeat } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
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
  const [loading, setLoading] = useState(false);

  const handleMarkAsReceived = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const result = await update(payment.id, {
        status: 'received',
        received_date: new Date().toISOString().split('T')[0]
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Create next payment if it's recurring
      if (payment.is_recurring) {
        try {
          const { data, error } = await supabase.rpc('create_next_recurring_payment', {
            payment_id: payment.id
          });

          if (error) {
            console.error('Error creating next recurring payment:', error);
          } else if (data) {
            toast.success('Pagamento marcado como recebido e próximo pagamento criado!');
          } else {
            toast.success('Pagamento marcado como recebido!');
          }
        } catch (error) {
          console.error('Error with recurring payment:', error);
          toast.success('Pagamento marcado como recebido!');
        }
      } else {
        toast.success('Pagamento marcado como recebido!');
      }

      onRefresh();
    } catch (error: any) {
      console.error('Erro ao marcar pagamento como recebido:', error);
      toast.error('Erro ao marcar pagamento como recebido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) {
      return;
    }

    setLoading(true);
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
      setLoading(false);
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
        {payment.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsReceived}
            disabled={loading}
            className="text-green-600 hover:text-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Marcar como Recebido
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(payment)}
          disabled={loading}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ReceivablePaymentActions;
