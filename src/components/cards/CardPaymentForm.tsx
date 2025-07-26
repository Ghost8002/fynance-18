
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
import { CreditCard, Loader2 } from "lucide-react";

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

  const validateForm = () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.cardId) {
      toast({
        title: "Erro",
        description: "Selecione um cartão",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.amount) {
      toast({
        title: "Erro",
        description: "Informe o valor do pagamento",
        variant: "destructive",
      });
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erro",
        description: "O valor do pagamento deve ser maior que zero",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      
      // Usar a função RPC segura do Supabase para processar o pagamento
      const { data, error } = await supabase.rpc('process_card_payment_secure', {
        p_card_id: formData.cardId,
        p_amount: amount,
        p_account_id: formData.accountId || null,
        p_description: formData.description
      });

      if (error) {
        throw error;
      }

      // Criar transação de pagamento na tabela transactions
      const selectedCard = cards?.find(card => card.id === formData.cardId);
      if (selectedCard) {
        const { error: transactionError } = await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'expense',
          description: `${formData.description} - ${selectedCard.name}`,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          card_id: formData.cardId,
          account_id: formData.accountId || null,
          notes: `Pagamento do cartão ${selectedCard.name}`
        });

        if (transactionError) {
          console.error('Erro ao criar transação:', transactionError);
          // Não falha o pagamento se a transação não for criada
        }
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

    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      let errorMessage = "Não foi possível processar o pagamento";
      
      if (error?.message) {
        if (error.message.includes('insufficient')) {
          errorMessage = "Saldo insuficiente na conta selecionada";
        } else if (error.message.includes('card not found')) {
          errorMessage = "Cartão não encontrado";
        } else if (error.message.includes('invalid amount')) {
          errorMessage = "Valor inválido para pagamento";
        } else if (error.message.includes('access denied')) {
          errorMessage = "Você não tem permissão para realizar esta operação";
        } else if (error.message.includes('not authenticated')) {
          errorMessage = "Usuário não autenticado";
        } else if (error.message.includes('duplicate')) {
          errorMessage = "Pagamento duplicado detectado";
        } else if (error.message.includes('network')) {
          errorMessage = "Erro de conexão. Verifique sua internet.";
        } else {
          errorMessage = error.message;
        }
      } else if (error?.code) {
        switch (error.code) {
          case 'PGRST301':
            errorMessage = "Dados inválidos fornecidos";
            break;
          case 'PGRST302':
            errorMessage = "Recurso não encontrado";
            break;
          case 'PGRST303':
            errorMessage = "Erro de validação";
            break;
          default:
            errorMessage = `Erro ${error.code}: ${error.message || 'Erro desconhecido'}`;
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
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label htmlFor="accountId">Conta de Pagamento</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(value) => setFormData({ ...formData, accountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - {account.bank || 'Sem banco'}
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
              placeholder="Descrição do pagamento..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Processar Pagamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
