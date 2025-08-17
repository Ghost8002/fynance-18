import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import TagSelector from "@/components/shared/TagSelector";

interface TransactionEditFormProps {
  transaction: {
    id: string;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    date: string;
    category_id?: string;
    account_id?: string;
    card_id?: string;
    notes?: string;
    tags?: any[];
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TransactionEditForm = ({ transaction, isOpen, onClose, onSuccess }: TransactionEditFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: '',
    date: '',
    category_id: '',
    account_id: '',
    card_id: '',
    notes: '',
    tags: [] as string[]
  });

  const { user } = useSupabaseAuth();
  const { update } = useSupabaseData('transactions', user?.id);
  const { data: categories = [] } = useSupabaseData('categories', user?.id);
  const { data: accounts = [] } = useSupabaseData('accounts', user?.id);
  const { data: cards = [] } = useSupabaseData('cards', user?.id);
  const { data: tags = [] } = useSupabaseData('tags', user?.id);
  const { toast } = useToast();

  // Preencher formulário com dados da transação quando abrir
  useEffect(() => {
    if (transaction && isOpen) {
      setFormData({
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount.toString(),
        date: transaction.date,
        category_id: transaction.category_id || '',
        account_id: transaction.account_id || '',
        card_id: transaction.card_id || '',
        notes: transaction.notes || '',
        tags: transaction.tags ? transaction.tags.map((tag: any) => tag.id) : []
      });
    }
  }, [transaction, isOpen]);

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

    if (!formData.description || !formData.amount || !formData.date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!formData.account_id && !formData.card_id) {
      toast({
        title: "Erro",
        description: "Selecione uma conta ou cartão",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const transactionData = {
        type: formData.type,
        description: formData.description,
        amount: Number(formData.amount),
        date: formData.date,
        category_id: formData.category_id || null,
        account_id: formData.account_id || null,
        card_id: formData.card_id || null,
        notes: formData.notes || null,
        tags: formData.tags.length > 0 ? formData.tags.map(tagId => {
          const tag = tags.find(t => t.id === tagId);
          return tag ? { id: tag.id, name: tag.name, color: tag.color } : null;
        }).filter(Boolean) : []
      };

      const { error } = await update(transaction.id, transactionData);

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a transação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
          <DialogDescription>
            Atualize os dados da transação
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input 
              id="description" 
              placeholder="Ex: Salário" 
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input 
              id="amount" 
              type="number" 
              step="0.01"
              placeholder="0,00" 
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Data *</Label>
            <Input 
              id="date" 
              type="date" 
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(cat => cat.type === formData.type)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account">Conta</Label>
            <Select value={formData.account_id} onValueChange={(value) => handleInputChange('account_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="card">Cartão</Label>
            <Select value={formData.card_id} onValueChange={(value) => handleInputChange('card_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cartão..." />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea 
              id="notes" 
              placeholder="Observações adicionais..." 
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <TagSelector
              selectedTags={formData.tags}
              onTagsChange={handleTagsChange}
            />
          </div>
        </form>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionEditForm;
