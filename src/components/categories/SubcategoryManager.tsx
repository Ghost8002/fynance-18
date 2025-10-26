import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSubcategories } from '@/hooks/useSubcategories';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/database';

type Subcategory = Database['public']['Tables']['subcategories']['Row'];

interface SubcategoryManagerProps {
  categoryId: string;
  onSubcategorySelect?: (subcategory: Subcategory | null) => void;
}

const SubcategoryManager: React.FC<SubcategoryManagerProps> = ({ 
  categoryId, 
  onSubcategorySelect 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    subcategories, 
    loading, 
    fetchSubcategories, 
    createSubcategory, 
    updateSubcategory, 
    deleteSubcategory 
  } = useSubcategories({ userId: user?.id, categoryId });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubcategory, setCurrentSubcategory] = useState<Subcategory | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#9CA3AF');

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da subcategoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const result = await createSubcategory({
      category_id: categoryId,
      name: name.trim(),
      color,
      sort_order: 0,
    });

    if (result) {
      toast({
        title: "Sucesso",
        description: "Subcategoria criada com sucesso.",
      });
      setName('');
      setColor('#9CA3AF');
      setIsDialogOpen(false);
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível criar a subcategoria.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!currentSubcategory || !name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da subcategoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const result = await updateSubcategory(currentSubcategory.id, {
      name: name.trim(),
      color,
    });

    if (result) {
      toast({
        title: "Sucesso",
        description: "Subcategoria atualizada com sucesso.",
      });
      setName('');
      setColor('#9CA3AF');
      setIsEditing(false);
      setIsDialogOpen(false);
      setCurrentSubcategory(null);
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a subcategoria.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta subcategoria?')) {
      return;
    }

    await deleteSubcategory(id);
    toast({
      title: "Sucesso",
      description: "Subcategoria excluída com sucesso.",
    });
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setCurrentSubcategory(null);
    setName('');
    setColor('#9CA3AF');
    setIsDialogOpen(true);
  };

  const openEditDialog = (subcategory: Subcategory) => {
    setIsEditing(true);
    setCurrentSubcategory(subcategory);
    setName(subcategory.name);
    setColor(subcategory.color || '#9CA3AF');
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Subcategorias</h3>
        <Button 
          onClick={openCreateDialog}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {loading ? (
        <p>Carregando subcategorias...</p>
      ) : subcategories.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma subcategoria cadastrada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subcategories.map((subcategory) => (
            <div 
              key={subcategory.id} 
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: subcategory.color || '#9CA3AF' }}
                />
                <span>{subcategory.name}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(subcategory)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(subcategory.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Subcategoria' : 'Criar Subcategoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da subcategoria"
              />
            </div>
            <div>
              <Label htmlFor="color">Cor</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={isEditing ? handleUpdate : handleCreate}>
                {isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubcategoryManager;