
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
      // Validação de valor
      const amount = parseFloat(formData.amount.toString());
      if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
        throw new Error('O valor deve ser um número positivo válido');
      }

      const submitData = {
        user_id: user.id,
        description: formData.description,
        amount: amount, // Usar o valor validado
        due_date: formData.due_date.toISOString().split('T')[0],
        notes: formData.notes || null,
        account_id: formData.account_id || null,
        category_id: formData.category_id || null,
        is_recurring: formData.is_recurring || false,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        status: 'pending'
      };

      // Validate required fields
      if (!submitData.description || !submitData.amount || !submitData.due_date) {
        toast.error('Preencha todos os campos obrigatórios');
        return false;
      }

      // Validate recurrence fields
      if (submitData.is_recurring && !submitData.recurrence_type) {
        toast.error('Selecione o tipo de recorrência');
        return false;
      }

      // Validate amount
      if (submitData.amount <= 0) {
        toast.error('O valor deve ser maior que zero');
        return false;
      }

      let result;
      if (payment) {
        // Updating existing payment - only send the fields that can be updated
        const updateData = {
          description: submitData.description,
          amount: submitData.amount,
          due_date: submitData.due_date,
          notes: submitData.notes,
          account_id: submitData.account_id,
          category_id: submitData.category_id,
          is_recurring: submitData.is_recurring,
          recurrence_type: submitData.recurrence_type
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
      console.error('Error submitting receivable payment:', error);
      toast.error(error.message || 'Erro ao salvar pagamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading };
};
