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
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { useAuth } from "@/hooks/useAuth";
import { ArrowUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AddMoneyToGoalModalProps {
  goalId: string;
  goalTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddMoneyToGoalModal = ({ 
  goalId, 
  goalTitle, 
  open, 
  onOpenChange,
  onSuccess
}: AddMoneyToGoalModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: accounts } = useRealtimeData('accounts');
  const { data: goals } = useRealtimeData('goals');
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
    
    if (!formData.accountId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta de origem",
        variant: "destructive",
      });
      return false;
    }
    
    const selectedAccount = accounts?.find(acc => acc.id === formData.accountId);
    if (selectedAccount && Number(selectedAccount.balance) < parseFloat(formData.amount)) {
      toast({
        title: "Erro",
        description: "Saldo insuficiente na conta selecionada",
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
      
      // Buscar ou criar conta "Metas"
      let goalsAccount = accounts?.find(acc => acc.name === "Metas");
      
      if (!goalsAccount) {
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            user_id: user?.id,
            name: "Metas",
            type: "savings",
            balance: 0,
            color: "#10b981"
          })
          .select()
          .single();
          
        if (accountError) throw accountError;
        goalsAccount = newAccount;
      }
      
      // Criar transação de transferência (débito na conta origem)
      const { error: debitError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: "expense",
          description: `Transferência para meta: ${goalTitle}`,
          amount: amount,
          account_id: formData.accountId,
          date: new Date().toISOString().split('T')[0],
          tags: ["meta", "transferência"]
        });
      
      if (debitError) throw debitError;
      
      // Criar transação de transferência (crédito na conta Metas)
      const { error: creditError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: "income",
          description: `Recebido de transferência - meta: ${goalTitle}`,
          amount: amount,
          account_id: goalsAccount.id,
          date: new Date().toISOString().split('T')[0],
          tags: ["meta", "transferência"]
        });
      
      if (creditError) throw creditError;
      
      // Atualizar saldo da conta origem
      const { error: updateOriginError } = await supabase
        .from('accounts')
        .update({
          balance: Number(accounts?.find(acc => acc.id === formData.accountId)?.balance || 0) - amount
        })
        .eq('id', formData.accountId);
      
      if (updateOriginError) throw updateOriginError;
      
      // Atualizar saldo da conta Metas
      const { error: updateGoalsError } = await supabase
        .from('accounts')
        .update({
          balance: Number(goalsAccount.balance) + amount
        })
        .eq('id', goalsAccount.id);
      
      if (updateGoalsError) throw updateGoalsError;
      
      // Atualizar progresso da meta
      const currentGoal = goals?.find(g => g.id === goalId);
      const { error: updateGoalError } = await supabase
        .from('goals')
        .update({
          current_amount: Number(currentGoal?.current_amount || 0) + amount
        })
        .eq('id', goalId);
      
      if (updateGoalError) throw updateGoalError;
      
      toast({
        title: "Sucesso",
        description: `R$ ${amount.toFixed(2)} adicionado à meta com sucesso!`,
      });
      
      setFormData({ amount: "", accountId: "" });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao adicionar dinheiro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar dinheiro à meta. Tente novamente.",
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
            <ArrowUp className="h-5 w-5 text-green-600" />
            Adicionar Dinheiro à Meta
          </DialogTitle>
          <DialogDescription>
            Transferir dinheiro de uma conta para a meta: {goalTitle}
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
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0,00"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountId">Conta de Origem *</Label>
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
                    {account.name} - Saldo: R$ {Number(account.balance).toFixed(2)}
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
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMoneyToGoalModal;
