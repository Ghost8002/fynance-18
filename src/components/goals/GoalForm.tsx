
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
import { Target } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { TagSelector } from "@/components/shared/TagSelector";

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
  const { insert } = useSupabaseData('goals', user?.id);
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
                        <Button className="bg-finance-blue hover:bg-finance-blue/90">
          <Target className="mr-2 h-4 w-4" /> Criar Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Meta</DialogTitle>
          <DialogDescription>
            Defina metas financeiras e acompanhe seu progresso
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Meta *</Label>
            <Input 
              id="title" 
              placeholder="Ex: Viagem, Carro novo, etc." 
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="target">Valor Total *</Label>
            <Input 
              id="target" 
              type="number" 
              step="0.01"
              placeholder="0,00" 
              value={formData.target_amount}
              onChange={(e) => handleInputChange('target_amount', e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="initialAmount">Valor Inicial (se já tem guardado)</Label>
            <Input 
              id="initialAmount" 
              type="number" 
              step="0.01"
              placeholder="0,00" 
              value={formData.current_amount}
              onChange={(e) => handleInputChange('current_amount', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deadline">Data Limite</Label>
            <Input 
              id="deadline" 
              type="date" 
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Input 
              id="category" 
              placeholder="Ex: Viagem, Emergência, etc." 
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input 
              id="description" 
              placeholder="Descreva sua meta..." 
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

export default GoalForm;
