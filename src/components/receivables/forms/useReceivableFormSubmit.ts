
import { useState } from 'react';
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export const useReceivableFormSubmit = (payment: any, onSubmit: () => void) => {
  const { user } = useSupabaseAuth();
  const { insert, update } = useSupabaseData('receivable_payments', user?.id);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setLoading(true);

    try {
      const data = {
        description: formData.description,
        amount: parseFloat(formData.amount.toString()),
        due_date: format(formData.due_date, 'yyyy-MM-dd'),
        notes: formData.notes || null,
        account_id: formData.account_id || null,
        category_id: formData.category_id || null,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        user_id: user?.id,
      };

      let result;
      if (payment) {
        result = await update(payment.id, data);
      } else {
        result = await insert(data);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Sucesso",
        description: payment ? "Pagamento atualizado com sucesso!" : "Pagamento criado com sucesso!",
      });

      onSubmit();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading };
};
