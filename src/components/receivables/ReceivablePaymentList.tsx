
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, DollarSign, Edit, Trash2 } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";
import ReceivablePaymentForm from "./ReceivablePaymentForm";

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received':
        return 'Recebido';
      case 'overdue':
        return 'Vencido';
      default:
        return 'Pendente';
    }
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
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-medium text-foreground">
                        {payment.description}
                      </h3>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        R$ {Number(payment.amount).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Vencimento: {format(new Date(payment.due_date), 'dd/MM/yyyy')}
                      </div>
                      {payment.received_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Recebido: {format(new Date(payment.received_date), 'dd/MM/yyyy')}
                        </div>
                      )}
                    </div>
                    
                    {payment.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPayment(payment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
