
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard } from "lucide-react";

interface CardPaymentFormProps {
  cardId?: string;
  onPaymentAdded?: () => void;
}

export const CardPaymentForm = ({ cardId, onPaymentAdded }: CardPaymentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: cards } = useSupabaseData('cards', user?.id);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    cardId: cardId || "",
    amount: "",
    accountId: "",
    description: "Pagamento de cartão"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (!formData.cardId || !formData.amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: "Erro",
        description: "O valor do pagamento deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Usar a função RPC do Supabase para processar o pagamento
      const { data, error } = await supabase.rpc('process_card_payment', {
        p_card_id: formData.cardId,
        p_amount: amount,
        p_account_id: formData.accountId || null,
        p_description: formData.description
      });

      if (error) throw error;

      // Criar transação de pagamento na tabela transactions
      const selectedCard = cards?.find(card => card.id === formData.cardId);
      if (selectedCard) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'expense',
          description: `${formData.description} - ${selectedCard.name}`,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          card_id: formData.cardId,
          account_id: formData.accountId || null,
          notes: `Pagamento do cartão ${selectedCard.name}`
        });
      }

      toast({
        title: "Sucesso",
        description: "Pagamento processado com sucesso!",
      });

      // Reset form
      setFormData({
        cardId: cardId || "",
        amount: "",
        accountId: "",
        description: "Pagamento de cartão"
      });

      setOpen(false);
      onPaymentAdded?.();

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CreditCard size={16} />
          Pagar Cartão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento de Cartão</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cardId">Cartão *</Label>
            <Select 
              value={formData.cardId} 
              onValueChange={(value) => setFormData({ ...formData, cardId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cartão" />
              </SelectTrigger>
              <SelectContent>
                {cards?.map(card => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name} (•••• {card.last_four_digits})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Valor do Pagamento *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label htmlFor="accountId">Conta para Débito (Opcional)</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(value) => setFormData({ ...formData, accountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não debitar de nenhuma conta</SelectItem>
                {accounts?.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - R$ {parseFloat(account.balance || '0').toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do pagamento"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Processando..." : "Pagar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
