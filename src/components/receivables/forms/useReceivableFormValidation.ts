
import { toast } from "sonner";

interface FormData {
  description: string;
  amount: string | number;
  due_date: Date | undefined;
}

export const useReceivableFormValidation = () => {
  const validateForm = (formData: FormData): boolean => {
    if (!formData.description || !formData.amount || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return false;
    }

    return true;
  };

  return { validateForm };
};
