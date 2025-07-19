
import { toast } from "sonner";
import { isBefore } from "date-fns";

interface FormData {
  description: string;
  amount: string | number;
  due_date: Date | undefined;
  is_recurring: boolean;
  recurrence_type: string;
  account_id: string;
}

export const useReceivableFormValidation = () => {
  const validateForm = (formData: FormData): boolean => {
    if (!formData.description || !formData.amount || !formData.due_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return false;
    }

    // Validação de data de vencimento
    if (formData.due_date && isBefore(formData.due_date, new Date())) {
      toast.error("A data de vencimento deve ser futura");
      return false;
    }

    // Validação de valor
    const amount = parseFloat(formData.amount.toString());
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
      toast.error("O valor deve ser um número positivo válido");
      return false;
    }

    if (formData.is_recurring && !formData.recurrence_type) {
      toast.error("Selecione o tipo de recorrência");
      return false;
    }

    if (!formData.account_id) {
      toast.warning("Recomendamos selecionar uma conta para permitir a geração automática de transações ao marcar como recebido.");
    }

    return true;
  };

  return { validateForm };
};
