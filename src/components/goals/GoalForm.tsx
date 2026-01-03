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
import { Target, Plus } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { useToast } from "@/hooks/use-toast";
import TagSelector from "@/components/shared/TagSelector";

const GoalForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
    description: '',
    category: '',
    selectedTags: [] as string[]
  });

  const { user } = useSupabaseAuth();
  const { insert } = useRealtimeData('goals');
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
        user_id: user.id,
        title: formData.title,
        target_amount: Number(formData.target_amount),
        current_amount: formData.current_amount ? Number(formData.current_amount) : 0,
        deadline: formData.deadline || null,
        description: formData.description || null,
        category: formData.category || null,
        tags: formData.selectedTags,
        status: 'active'
      };

      const { error } = await insert(goalData);

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sucesso",
        description: "Meta criada com sucesso!",
      });

      // Reset form
      setFormData({
        title: '',
        target_amount: '',
        current_amount: '',
        deadline: '',
        description: '',
        category: '',
        selectedTags: []
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta. Tente novamente.",
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
        <Button className="bg-finance-blue hover:bg-finance-blue/90 text-xs md:text-sm h-8 md:h-10">
          <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> 
          <span className="hidden sm:inline">Adicionar Meta</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Criar Nova Meta</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Defina metas financeiras e acompanhe seu progresso
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
            <Label htmlFor="initialAmount" className="text-xs md:text-sm">Valor Inicial (se já tem guardado)</Label>
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

export default GoalForm;