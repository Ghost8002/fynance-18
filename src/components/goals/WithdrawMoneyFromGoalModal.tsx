import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { ArrowDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawMoneyFromGoalModalProps {
  goalId: string;
  goalTitle: string;
  currentAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const WithdrawMoneyFromGoalModal = ({ 
  goalId, 
  goalTitle,
  currentAmount,
  open, 
  onOpenChange,
  onSuccess
}: WithdrawMoneyFromGoalModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: goals } = useSupabaseData('goals', user?.id);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: "",
    accountId: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido",
        variant: "destructive",
      });
      return false;
    }
    
    if (parseFloat(formData.amount) > currentAmount) {
      toast({
        title: "Erro",
        description: "Valor maior que o saldo disponível na meta",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.accountId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta de destino",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const amount = parseFloat(formData.amount);
      
      // Buscar conta "Metas"
      const goalsAccount = accounts?.find(acc => acc.name === "Metas");
      
      if (!goalsAccount) {
        throw new Error("Conta Metas não encontrada");
      }
      
      // Criar transação de transferência (débito na conta Metas)
      const { error: debitError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: "expense",
          description: `Retirada da meta: ${goalTitle}`,
          amount: amount,
          account_id: goalsAccount.id,
          date: new Date().toISOString().split('T')[0],
          tags: ["meta", "transferência"]
        });
      
      if (debitError) throw debitError;
      
      // Criar transação de transferência (crédito na conta destino)
      const { error: creditError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: "income",
          description: `Transferência da meta: ${goalTitle}`,
          amount: amount,
          account_id: formData.accountId,
          date: new Date().toISOString().split('T')[0],
          tags: ["meta", "transferência"]
        });
      
      if (creditError) throw creditError;
      
      // Atualizar saldo da conta Metas
      const { error: updateGoalsError } = await supabase
        .from('accounts')
        .update({
          balance: Number(goalsAccount.balance) - amount
        })
        .eq('id', goalsAccount.id);
      
      if (updateGoalsError) throw updateGoalsError;
      
      // Atualizar saldo da conta destino
      const { error: updateDestError } = await supabase
        .from('accounts')
        .update({
          balance: Number(accounts?.find(acc => acc.id === formData.accountId)?.balance || 0) + amount
        })
        .eq('id', formData.accountId);
      
      if (updateDestError) throw updateDestError;
      
      // Atualizar progresso da meta
      const currentGoal = goals?.find(g => g.id === goalId);
      const { error: updateGoalError } = await supabase
        .from('goals')
        .update({
          current_amount: Number(currentGoal?.current_amount || 0) - amount
        })
        .eq('id', goalId);
      
      if (updateGoalError) throw updateGoalError;
      
      toast({
        title: "Sucesso",
        description: `R$ ${amount.toFixed(2)} retirado da meta com sucesso!`,
      });
      
      setFormData({ amount: "", accountId: "" });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao retirar dinheiro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível retirar dinheiro da meta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar contas (exceto a conta Metas)
  const availableAccounts = accounts?.filter(acc => acc.name !== "Metas") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5 text-red-600" />
            Retirar Dinheiro da Meta
          </DialogTitle>
          <DialogDescription>
            Transferir dinheiro da meta: {goalTitle} para uma conta
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              max={currentAmount}
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0,00"
              required
            />
            <p className="text-xs text-muted-foreground">
              Disponível na meta: R$ {currentAmount.toFixed(2)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountId">Conta de Destino *</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(value) => handleSelectChange("accountId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Retirar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawMoneyFromGoalModal;
