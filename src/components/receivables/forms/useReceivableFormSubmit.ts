
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
      const submitData = {
        user_id: user.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date.toISOString().split('T')[0],
        notes: formData.notes || null,
        account_id: formData.account_id || null,
        category_id: formData.category_id || null,
        is_recurring: formData.is_recurring || false,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        status: 'pending'
      };

      let result;
      if (payment) {
        // Updating existing payment
        const { id, user_id, created_at, updated_at, ...updateData } = submitData;
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
