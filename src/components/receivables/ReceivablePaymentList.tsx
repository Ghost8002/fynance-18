
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import ReceivablePaymentForm from "./ReceivablePaymentForm";
import ReceivablePaymentActions from "./ReceivablePaymentActions";

const ReceivablePaymentList = () => {
  const { user } = useAuth();
  const { data: payments, loading, refetch } = useSupabaseData('receivable_payments', user?.id);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const handleAddPayment = () => {
    setEditingPayment(null);
    setShowForm(true);
  };

  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    refetch();
    setShowForm(false);
    setEditingPayment(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando pagamentos...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl font-bold">Pagamentos à Receber</CardTitle>
          <Button onClick={handleAddPayment} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Pagamento
          </Button>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <ReceivablePaymentActions
                  key={payment.id}
                  payment={payment}
                  onEdit={handleEditPayment}
                  onRefresh={refetch}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum pagamento a receber cadastrado
              </p>
              <Button onClick={handleAddPayment} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Pagamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <ReceivablePaymentForm
            payment={editingPayment}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      )}
    </>
  );
};

export default ReceivablePaymentList;
