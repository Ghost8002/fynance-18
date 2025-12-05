
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
import TagSelector from "@/components/shared/TagSelector";
import { devError } from "@/utils/logger";

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useSupabaseAuth();
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { insert } = useSupabaseData('budgets', user?.id);
  const { toast } = useToast();

  // Filter expense categories only
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category_id) {
      newErrors.category_id = "Selecione uma categoria";
    }

    if (!formData.limit_amount) {
      newErrors.limit_amount = "Informe o valor limite";
    } else if (Number(formData.limit_amount) <= 0) {
      newErrors.limit_amount = "O valor deve ser maior que zero";
    } else if (Number(formData.limit_amount) > 1000000) {
      newErrors.limit_amount = "O valor não pode ser maior que R$ 1.000.000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

    if (!validateForm()) {
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
      setErrors({});
      setIsOpen(false);
    } catch (error) {
      devError('Error adding budget:', error);
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
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
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
        <Button className="bg-finance-blue hover:bg-finance-blue/90 text-xs md:text-sm h-8 md:h-10">
          <PiggyBank className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> 
          <span className="hidden sm:inline">Adicionar Orçamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Criar Novo Orçamento</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Defina limites de gastos por categoria
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3 md:gap-4 py-2 md:py-4">
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="category" className="text-xs md:text-sm">Categoria *</Label>
            <CategorySelector
              value={formData.category_id}
              onChange={(value) => handleInputChange('category_id', value)}
              categories={expenseCategories}
              type="expense"
              placeholder="Selecione uma categoria..."
              isMobile={true}
            />
            {errors.category_id && (
              <p className="text-xs text-red-500">{errors.category_id}</p>
            )}
          </div>
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="limit" className="text-xs md:text-sm">Valor Limite *</Label>
            <Input 
              id="limit" 
              type="number" 
              step="0.01"
              min="0.01"
              max="1000000"
              placeholder="0,00" 
              value={formData.limit_amount}
              onChange={(e) => handleInputChange('limit_amount', e.target.value)}
              required
              className={`h-8 md:h-10 text-xs md:text-sm ${errors.limit_amount ? 'border-red-500' : ''}`}
            />
            {errors.limit_amount && (
              <p className="text-xs text-red-500">{errors.limit_amount}</p>
            )}
          </div>
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="period" className="text-xs md:text-sm">Período</Label>
            <Select value={formData.period} onValueChange={(value) => handleInputChange('period', value)}>
              <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                <SelectValue placeholder="Selecione um período..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly" className="text-xs md:text-sm">Mensal</SelectItem>
                <SelectItem value="weekly" className="text-xs md:text-sm">Semanal</SelectItem>
                <SelectItem value="yearly" className="text-xs md:text-sm">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="description" className="text-xs md:text-sm">Descrição (opcional)</Label>
            <Input 
              id="description" 
              placeholder="Descreva este orçamento..." 
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="h-8 md:h-10 text-xs md:text-sm"
            />
          </div>

          <TagSelector
            selectedTags={formData.selectedTags}
            onTagsChange={handleTagsChange}
            isMobile={true}
          />
        </form>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            className="w-full sm:w-auto h-8 md:h-10 text-xs md:text-sm"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto h-8 md:h-10 text-xs md:text-sm"
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetForm;
