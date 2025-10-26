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
import { Target, Edit } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import TagSelector from "@/components/shared/TagSelector";

interface GoalEditFormProps {
  goal: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const GoalEditForm = ({ goal, onSuccess, onCancel }: GoalEditFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: goal.title || '',
    target_amount: goal.target_amount?.toString() || '',
    current_amount: goal.current_amount?.toString() || '',
    deadline: goal.deadline || '',
    description: goal.description || '',
    category: goal.category || '',
    selectedTags: goal.tags || []
  });

  const { user } = useSupabaseAuth();
  const { update } = useSupabaseData('goals', user?.id);
  const { toast } = useToast();

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

    if (!formData.title || !formData.target_amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const goalData = {
        title: formData.title,
        target_amount: Number(formData.target_amount),
        current_amount: formData.current_amount ? Number(formData.current_amount) : 0,
        deadline: formData.deadline || null,
        description: formData.description || null,
        category: formData.category || null,
        tags: formData.selectedTags,
      };

      const { error } = await update(goal.id, goalData);

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sucesso",
        description: "Meta atualizada com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta. Tente novamente.",
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
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg flex items-center">
            <Edit className="mr-2 h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            Editar Meta
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Atualize os dados da sua meta financeira
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3 md:gap-4 py-2 md:py-4">
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="title" className="text-xs md:text-sm">Título da Meta *</Label>
            <Input 
              id="title" 
              placeholder="Ex: Viagem, Carro novo, etc." 
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              className="h-8 md:h-10 text-xs md:text-sm"
            />
          </div>
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="target" className="text-xs md:text-sm">Valor Total *</Label>
            <Input 
              id="target" 
              type="number" 
              step="0.01"
              placeholder="0,00" 
              value={formData.target_amount}
              onChange={(e) => handleInputChange('target_amount', e.target.value)}
              required
              className="h-8 md:h-10 text-xs md:text-sm"
            />
          </div>
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="initialAmount" className="text-xs md:text-sm">Valor Atual</Label>
            <Input 
              id="initialAmount" 
              type="number" 
              step="0.01"
              placeholder="0,00" 
              value={formData.current_amount}
              onChange={(e) => handleInputChange('current_amount', e.target.value)}
              className="h-8 md:h-10 text-xs md:text-sm"
            />
          </div>
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="deadline" className="text-xs md:text-sm">Data Limite</Label>
            <Input 
              id="deadline" 
              type="date" 
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              className="h-8 md:h-10 text-xs md:text-sm"
            />
          </div>
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="category" className="text-xs md:text-sm">Categoria</Label>
            <Input 
              id="category" 
              placeholder="Ex: Viagem, Emergência, etc." 
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="h-8 md:h-10 text-xs md:text-sm"
            />
          </div>
          <div className="grid gap-1.5 md:gap-2">
            <Label htmlFor="description" className="text-xs md:text-sm">Descrição (opcional)</Label>
            <Input 
              id="description" 
              placeholder="Descreva sua meta..." 
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
            onClick={onCancel}
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
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoalEditForm;