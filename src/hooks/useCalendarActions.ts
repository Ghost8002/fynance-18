
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent } from './useCalendarEvents';

export const useCalendarActions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { update: updateReceivable } = useSupabaseData('receivable_payments', user?.id);
  const { update: updateDebt } = useSupabaseData('debts', user?.id);

  const markReceivableAsReceived = async (event: CalendarEvent) => {
    if (event.type !== 'receivable') return;

    try {
      const { error } = await updateReceivable(event.rawData.id, {
        status: 'received',
        received_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pagamento marcado como recebido!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar pagamento: " + error.message,
        variant: "destructive",
      });
    }
  };

  const markDebtAsPaid = async (event: CalendarEvent) => {
    if (event.type !== 'debt') return;

    try {
      const { error } = await updateDebt(event.rawData.id, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      toast({
        title: "Sucesso", 
        description: "Dívida marcada como paga!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dívida: " + error.message,
        variant: "destructive",
      });
    }
  };

  return {
    markReceivableAsReceived,
    markDebtAsPaid
  };
};
