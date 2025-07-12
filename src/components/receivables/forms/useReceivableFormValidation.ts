
import { useToast } from "@/hooks/use-toast";

interface FormData {
  description: string;
  amount: string | number;
  due_date: Date | undefined;
  is_recurring: boolean;
  recurrence_type: string;
  account_id: string;
}

export const useReceivableFormValidation = () => {
  const { toast } = useToast();

  const validateForm = (formData: FormData): boolean => {
    if (!formData.description || !formData.amount || !formData.due_date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return false;
    }

    if (formData.is_recurring && !formData.recurrence_type) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de recorrência",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.account_id) {
      toast({
        title: "Atenção",
        description: "Recomendamos selecionar uma conta para permitir a geração automática de transações ao marcar como recebido.",
        variant: "default",
      });
    }

    return true;
  };

  return { validateForm };
};
