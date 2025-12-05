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
import { devError } from "@/utils/logger";

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
      // Buscar dados do cartão
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (cardError) throw cardError;

      if (paymentType === 'installment') {
        // Lógica de parcelamento
        const count = parseInt(installmentCount);
        const installmentAmount = amount / count;
        const today = new Date();
        
        // Criar transação principal
        const { data: parentTransaction, error: parentError } = await supabase
          .from('transactions')
          .insert({
            user_id: user?.id,
            description: `Pagamento parcelado de fatura - Cartão`,
            amount: -amount,
            date: today.toISOString().split('T')[0],
            type: 'expense',
            account_id: selectedAccountId,
            card_id: cardId,
            installments_count: count
          })
          .select()
          .single();

        if (parentError) throw parentError;

        // Criar transações das parcelas
        const installmentTransactions = [];
        for (let i = 0; i < count; i++) {
          const installmentDate = new Date(today);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          installmentTransactions.push({
            user_id: user?.id,
            description: `Pagamento de fatura - Cartão (Parcela ${i + 1}/${count})`,
            amount: -installmentAmount,
            date: installmentDate.toISOString().split('T')[0],
            type: 'expense',
            account_id: selectedAccountId,
            card_id: cardId,
            parent_transaction_id: parentTransaction.id,
            installment_number: i + 1,
            installments_count: count
          });
        }

        const { error: installmentsError } = await supabase
          .from('transactions')
          .insert(installmentTransactions);

        if (installmentsError) throw installmentsError;

        // Atualizar saldo da conta (apenas primeira parcela)
        const account = accounts?.find(acc => acc.id === selectedAccountId);
        if (account) {
          const { error: accountError } = await supabase
            .from('accounts')
            .update({ balance: Number(account.balance) - installmentAmount })
            .eq('id', selectedAccountId);

          if (accountError) throw accountError;
        }

        // Atualizar fatura atual
        const { error: billError } = await supabase
          .from('card_bills')
          .update({
            paid_amount: installmentAmount,
            remaining_amount: remainingAmount - installmentAmount,
            status: installmentAmount >= remainingAmount ? 'paid' : 'partial'
          })
          .eq('id', billId);

        if (billError) throw billError;

        // Gerar faturas para os meses seguintes
        for (let i = 1; i < count; i++) {
          const futureDate = new Date(today);
          futureDate.setMonth(futureDate.getMonth() + i);
          const futureMonth = futureDate.getMonth() + 1;
          const futureYear = futureDate.getFullYear();

          // Chamar função para gerar fatura do mês futuro
          await supabase.rpc('generate_monthly_bill', {
            p_card_id: cardId,
            p_month: futureMonth,
            p_year: futureYear
          });
        }

        // Restaurar crédito do cartão
        const { error: cardUpdateError } = await supabase
          .from('cards')
          .update({ 
            used_amount: Math.max(0, Number(card.used_amount) - amount)
          })
          .eq('id', cardId);

        if (cardUpdateError) throw cardUpdateError;

      } else {
        // Pagamento completo ou parcial
        const transactionData = {
          user_id: user?.id,
          description: `Pagamento de fatura - Cartão`,
          amount: -amount,
          date: new Date().toISOString().split('T')[0],
          type: 'expense',
          account_id: selectedAccountId,
          card_id: cardId,
          installments_count: 1
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

        // Restaurar crédito do cartão
        const { error: cardUpdateError } = await supabase
          .from('cards')
          .update({ 
            used_amount: Math.max(0, Number(card.used_amount) - amount)
          })
          .eq('id', cardId);

        if (cardUpdateError) throw cardUpdateError;
      }

      toast({
        title: "Pagamento realizado com sucesso"
      });

      onPaymentSuccess();
      onOpenChange(false);
    } catch (error) {
      devError('Erro ao processar pagamento:', error);
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
