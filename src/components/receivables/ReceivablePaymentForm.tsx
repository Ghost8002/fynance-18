
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReceivableFormFields from "./forms/ReceivableFormFields";
import { useReceivableFormValidation } from "./forms/useReceivableFormValidation";
import { useReceivableFormSubmit } from "./forms/useReceivableFormSubmit";

interface ReceivablePaymentFormProps {
  payment?: any;
  onSubmit: () => void;
  onCancel: () => void;
}

const ReceivablePaymentForm: React.FC<ReceivablePaymentFormProps> = ({
  payment,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    description: payment?.description || '',
    amount: payment?.amount || '',
    due_date: payment?.due_date ? new Date(payment.due_date) : undefined,
    notes: payment?.notes || '',
  });

  const { validateForm } = useReceivableFormValidation();
  const { handleSubmit, loading } = useReceivableFormSubmit(payment, onSubmit);

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    await handleSubmit(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{payment ? 'Editar Pagamento' : 'Novo Pagamento à Receber'}</CardTitle>
        <CardDescription>
          {payment ? 'Atualize os dados do pagamento' : 'Adicione um novo pagamento a ser recebido'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-4">
          <form onSubmit={onFormSubmit} className="space-y-4">
            <ReceivableFormFields
              formData={formData}
              setFormData={setFormData}
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : payment ? 'Atualizar' : 'Criar Pagamento'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ReceivablePaymentForm;
