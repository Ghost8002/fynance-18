
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PiggyBank } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import CategorySelector from "@/components/shared/CategorySelector";
import { dateToLocalDateString } from "@/utils/dateValidation";
import { TagSelector } from "@/components/shared/TagSelector";

const BudgetForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    limit_amount: '',
    period: 'monthly',
    description: '',
    selectedTags: [] as string[]
  });

  const { user } = useSupabaseAuth();
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { insert } = useSupabaseData('budgets', user?.id);
  const { toast } = useToast();

  // Filter expense categories only
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

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

    if (!formData.category_id || !formData.limit_amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Calculate start and end dates for current month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const budgetData = {
        user_id: user.id,
        category_id: formData.category_id,
        limit_amount: Number(formData.limit_amount),
        period: formData.period,
        start_date: dateToLocalDateString(startDate),
        end_date: dateToLocalDateString(endDate),
        spent_amount: 0,
        tags: formData.selectedTags,
      };

      const { error } = await insert(budgetData);

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso!",
      });

      // Reset form
      setFormData({
        category_id: '',
        limit_amount: '',
        period: 'monthly',
        description: '',
        selectedTags: []
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding budget:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o orçamento. Tente novamente.",
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
      selectedTags: tags
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
                        <Button className="bg-finance-blue hover:bg-finance-blue/90">
          <PiggyBank className="mr-2 h-4 w-4" /> Adicionar Orçamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Orçamento</DialogTitle>
          <DialogDescription>
            Defina limites de gastos por categoria
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria *</Label>
            <CategorySelector
              value={formData.category_id}
              onChange={(value) => handleInputChange('category_id', value)}
              categories={expenseCategories}
              type="expense"
              placeholder="Selecione uma categoria..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="limit">Valor Limite *</Label>
            <Input 
              id="limit" 
              type="number" 
              step="0.01"
              placeholder="0,00" 
              value={formData.limit_amount}
              onChange={(e) => handleInputChange('limit_amount', e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="period">Período</Label>
            <Select value={formData.period} onValueChange={(value) => handleInputChange('period', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um período..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input 
              id="description" 
              placeholder="Descreva este orçamento..." 
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <TagSelector
            selectedTags={formData.selectedTags}
            onTagsChange={handleTagsChange}
          />
        </form>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
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

export default BudgetForm;
