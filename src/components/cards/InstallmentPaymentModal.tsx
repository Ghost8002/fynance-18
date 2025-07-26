import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Loader2, CreditCard, Calendar, DollarSign } from "lucide-react";

interface InstallmentPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installmentItem: any;
  onPaymentCompleted: () => void;
}

export const InstallmentPaymentModal = ({ 
  open, 
  onOpenChange, 
  installmentItem, 
  onPaymentCompleted 
}: InstallmentPaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const { data: accounts } = useSupabaseData('accounts', user?.id);

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handlePayment = async () => {
    if (!selectedAccountId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta para o pagamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('process_installment_payment', {
        p_installment_item_id: installmentItem.id,
        p_account_id: selectedAccountId,
        p_payment_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Parcela paga com sucesso!",
      });

      onPaymentCompleted();
      onOpenChange(false);
      setSelectedAccountId("");

    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      let errorMessage = "Não foi possível processar o pagamento";
      
      if (error?.message) {
        if (error.message.includes('already paid')) {
          errorMessage = "Parcela já foi paga";
        } else if (error.message.includes('not found')) {
          errorMessage = "Parcela não encontrada";
        } else if (error.message.includes('access denied')) {
          errorMessage = "Você não tem permissão para realizar esta operação";
        } else if (error.message.includes('not authenticated')) {
          errorMessage = "Usuário não autenticado";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!installmentItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Pagar Parcela
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Installment Info */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Parcela:</span>
              <span className="text-sm">
                {installmentItem.installment_number}/{installmentItem.installments_count}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Valor:</span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(installmentItem.amount)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Vencimento:</span>
              <span className="text-sm">
                {formatDate(installmentItem.due_date)}
              </span>
            </div>
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">Conta de Pagamento *</Label>
            <Select 
              value={selectedAccountId} 
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{account.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        R$ {account.balance?.toFixed(2)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Calendar size={14} />
              <span>Data do pagamento: {formatDate(new Date().toISOString().split('T')[0])}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handlePayment} 
              disabled={loading || !selectedAccountId} 
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 