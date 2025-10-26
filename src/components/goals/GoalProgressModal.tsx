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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface GoalProgressModalProps {
  goalId: string;
  goalTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProgressAdded: () => void;
}

const GoalProgressModal = ({ 
  goalId, 
  goalTitle, 
  open, 
  onOpenChange,
  onProgressAdded
}: GoalProgressModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { insert: insertTransaction } = useSupabaseData('transactions', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { updateGoalProgress } = useBalanceUpdates();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: "",
    description: `Progresso para meta: ${goalTitle}`,
    accountId: "",
    categoryId: "",
    notes: "",
    date: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        description: "Informe um valor válido para o progresso",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.accountId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.categoryId) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria",
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
      
      // Criar transação para o progresso da meta
      const transactionData = {
        user_id: user?.id,
        type: "income" as const,
        description: formData.description,
        amount: amount,
        category_id: formData.categoryId,
        account_id: formData.accountId,
        date: formData.date,
        notes: formData.notes || null,
        tags: []
      };
      
      const { error: transactionError } = await insertTransaction(transactionData);
      
      if (transactionError) {
        throw new Error(transactionError);
      }
      
      // Atualizar o progresso da meta
      const { success, error: goalError } = await updateGoalProgress(goalId, amount);
      
      if (!success) {
        throw new Error(goalError);
      }
      
      toast({
        title: "Sucesso",
        description: "Progresso adicionado à meta com sucesso!",
      });
      
      // Resetar formulário
      setFormData({
        amount: "",
        description: `Progresso para meta: ${goalTitle}`,
        accountId: "",
        categoryId: "",
        notes: "",
        date: new Date().toISOString().split('T')[0]
      });
      
      onProgressAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao adicionar progresso:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar progresso à meta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorias do tipo "income"
  const incomeCategories = categories?.filter(cat => cat.type === "income") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Progresso à Meta</DialogTitle>
          <DialogDescription>
            Adicione um valor para contribuir com sua meta: {goalTitle}
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
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descrição da transação"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountId">Conta *</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(value) => handleSelectChange("accountId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria *</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => handleSelectChange("categoryId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {incomeCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Observações adicionais"
            />
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Progresso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalProgressModal;