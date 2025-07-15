
import { useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useReceivableFormSubmit = (payment: any, onSubmit: () => void) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { insert, update } = useSupabaseData('receivable_payments', user?.id);

  const handleSubmit = async (formData: any) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);

    try {
      // Only use fields that exist in the receivable_payments table
      const submitData = {
        user_id: user.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date.toISOString().split('T')[0],
        notes: formData.notes || null,
        status: 'pending'
      };

      let result;
      if (payment) {
        // Updating existing payment - only update allowed fields
        const updateData = {
          description: submitData.description,
          amount: submitData.amount,
          due_date: submitData.due_date,
          notes: submitData.notes,
          status: submitData.status
        };
        result = await update(payment.id, updateData);
      } else {
        // Creating new payment
        result = await insert(submitData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(payment ? 'Pagamento atualizado com sucesso!' : 'Pagamento criado com sucesso!');
      onSubmit();
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar pagamento:', error);
      toast.error('Erro ao salvar pagamento: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading };
};
