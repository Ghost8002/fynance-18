import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BillPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string;
  cardId: string;
  totalAmount: number;
  remainingAmount: number;
  paymentType: 'full' | 'partial' | 'installment';
  onPaymentSuccess: () => void;
}

export const BillPaymentDialog = ({
  open,
  onOpenChange,
  billId,
  cardId,
  totalAmount,
  remainingAmount,
  paymentType,
  onPaymentSuccess
}: BillPaymentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>(remainingAmount.toString());
  const [installmentCount, setInstallmentCount] = useState<string>("2");
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePayment = async () => {
    if (!selectedAccountId) {
      toast({
        variant: "destructive",
        title: "Selecione uma conta"
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Valor inválido"
      });
      return;
    }

    if (amount > remainingAmount) {
      toast({
        variant: "destructive",
        title: "Valor maior que o saldo restante"
      });
      return;
    }

    setLoading(true);

    try {
      // Criar transação de pagamento
      const transactionData = {
        user_id: user?.id,
        description: `Pagamento de fatura - Cartão`,
        amount: -amount, // Negativo porque é saída
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        account_id: selectedAccountId,
        card_id: cardId,
        installments_count: paymentType === 'installment' ? parseInt(installmentCount) : 1
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Atualizar saldo da conta
      const account = accounts?.find(acc => acc.id === selectedAccountId);
      if (account) {
        const { error: accountError } = await supabase
          .from('accounts')
          .update({ balance: Number(account.balance) - amount })
          .eq('id', selectedAccountId);

        if (accountError) throw accountError;
      }

      // Atualizar fatura
      const { error: billError } = await supabase
        .from('card_bills')
        .update({
          paid_amount: remainingAmount === amount ? totalAmount : amount,
          remaining_amount: remainingAmount - amount,
          status: remainingAmount === amount ? 'paid' : 'partial'
        })
        .eq('id', billId);

      if (billError) throw billError;

      toast({
        title: "Pagamento realizado com sucesso"
      });

      onPaymentSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (paymentType) {
      case 'full':
        return 'Pagar Fatura Completa';
      case 'partial':
        return 'Pagar Parcialmente';
      case 'installment':
        return 'Parcelar Fatura';
      default:
        return 'Pagar Fatura';
    }
  };

  const getDialogDescription = () => {
    switch (paymentType) {
      case 'full':
        return `Você está prestes a pagar o valor total de ${formatCurrency(remainingAmount)}`;
      case 'partial':
        return 'Digite o valor que deseja pagar';
      case 'installment':
        return 'Defina o valor e o número de parcelas';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Conta de Pagamento</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - {formatCurrency(Number(account.balance))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {paymentType === 'partial' && (
            <div className="space-y-2">
              <Label>Valor a Pagar</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
          )}

          {paymentType === 'installment' && (
            <>
              <div className="space-y-2">
                <Label>Valor Total</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Número de Parcelas</Label>
                <Input
                  type="number"
                  min="2"
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                  placeholder="2"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {installmentCount && parseFloat(paymentAmount) > 0 && (
                  <p>
                    Cada parcela: {formatCurrency(parseFloat(paymentAmount) / parseInt(installmentCount))}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handlePayment} disabled={loading}>
            {loading ? 'Processando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
