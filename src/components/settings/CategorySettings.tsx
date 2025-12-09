import { useState, useEffect, DragEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit2, Check, X, GripVertical } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}
const CategorySettings = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    data: categories,
    loading,
    insert,
    update,
    remove,
    refetch
  } = useSupabaseData('categories', user?.id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    color: ''
  });
  const [editingCategory, setEditingCategory] = useState({
    name: '',
    color: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [dragOverType, setDragOverType] = useState<'income' | 'expense' | null>(null);

  const predefinedColors = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#6B7280', '#374151', '#1F2937'];
  const incomeCategories = categories.filter((cat: Category) => cat.type === 'income').sort((a: Category, b: Category) => a.sort_order - b.sort_order);
  const expenseCategories = categories.filter((cat: Category) => cat.type === 'expense').sort((a: Category, b: Category) => a.sort_order - b.sort_order);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, category: Category) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', category.id);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
    setDragOverType(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, type: 'income' | 'expense') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverType(type);
  };

  const handleDragLeave = () => {
    setDragOverType(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetType: 'income' | 'expense') => {
    e.preventDefault();
    setDragOverType(null);

    if (!draggedCategory) return;

    // Se a categoria já é do tipo alvo, não faz nada
    if (draggedCategory.type === targetType) {
      setDraggedCategory(null);
      return;
    }

    // Atualiza o tipo da categoria
    const { error } = await update(draggedCategory.id, {
      type: targetType,
      sort_order: 999 // Coloca no final da lista
    });

    if (error) {
      toast({
        title: "Erro",
        description: `Erro ao mover categoria: ${error}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: `Categoria "${draggedCategory.name}" movida para ${targetType === 'income' ? 'Receita' : 'Despesa'}`
      });
    }

    setDraggedCategory(null);
  };
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }
    
    const { getRandomColor } = await import('@/utils/colorGenerator');
    const categoryColor = newCategory.color || getRandomColor();
    
    console.log('Criando categoria:', {
      name: newCategory.name.trim(),
      type: newCategory.type,
      color: categoryColor,
      is_default: false,
      sort_order: 999,
      user_id: user.id
    });
    const {
      error
    } = await insert({
      name: newCategory.name.trim(),
      type: newCategory.type,
      color: categoryColor,
      is_default: false,
      sort_order: 999,
      user_id: user.id
    });
    if (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar categoria: ${error}`,
        variant: "destructive"
      });
    } else {
      console.log('Categoria criada com sucesso');
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso"
      });
      setNewCategory({
        name: '',
        type: 'expense',
        color: ''
      });
      setShowAddForm(false);
    }
  };
  const handleEditCategory = (category: Category) => {
    setEditingId(category.id);
    setEditingCategory({
      name: category.name,
      color: category.color
    });
  };
  const handleSaveEdit = async (categoryId: string) => {
    if (!editingCategory.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }
    const {
      error
    } = await update(categoryId, {
      name: editingCategory.name.trim(),
      color: editingCategory.color
    });
    if (error) {
      toast({
        title: "Erro",
        description: `Erro ao atualizar categoria: ${error}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso"
      });
      setEditingId(null);
    }
  };
  const handleDeleteCategory = async (categoryId: string) => {
    const {
      error
    } = await remove(categoryId);
    if (error) {
      toast({
        title: "Erro",
        description: `Erro ao deletar categoria: ${error}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Categoria deletada com sucesso"
      });
    }
  };

  const handleRemoveDuplicates = async () => {
    const categoryByKey = new Map<string, Category[]>();
    
    categories.forEach((category: Category) => {
      const key = `${category.name.toLowerCase()}_${category.type}`;
      if (!categoryByKey.has(key)) {
        categoryByKey.set(key, []);
      }
      categoryByKey.get(key)?.push(category);
    });

    let duplicatesRemoved = 0;
    
    for (const [, categoryGroup] of categoryByKey) {
      if (categoryGroup.length > 1) {
        const sorted = categoryGroup.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        for (let i = 1; i < sorted.length; i++) {
          if (!sorted[i].is_default) {
            await remove(sorted[i].id);
            duplicatesRemoved++;
          }
        }
      }
    }

    if (duplicatesRemoved > 0) {
      toast({
        title: "Sucesso",
        description: `${duplicatesRemoved} categoria(s) duplicada(s) removida(s).`,
      });
      refetch();
    } else {
      toast({
        title: "Info",
        description: "Nenhuma duplicata encontrada.",
      });
    }
  };
  const CategoryItem = ({
    category
  }: {
    category: Category;
  }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: draggedCategory?.id === category.id ? 0.5 : 1, 
        y: 0, 
        scale: draggedCategory?.id === category.id ? 0.95 : 1 
      }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        mass: 0.8
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      draggable
      onDragStart={(e) => handleDragStart(e as unknown as DragEvent<HTMLDivElement>, category)}
      onDragEnd={handleDragEnd}
      className="flex items-center justify-between p-3 border rounded-lg cursor-grab active:cursor-grabbing bg-card"
    >
      <div className="flex items-center space-x-3">
        <motion.div
          whileHover={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </motion.div>
        <motion.div 
          className="w-4 h-4 rounded-full border" 
          style={{ backgroundColor: category.color }}
          whileHover={{ scale: 1.3 }}
          transition={{ type: "spring", stiffness: 400 }}
        />
        {editingId === category.id ? (
          <div className="flex items-center space-x-2">
            <Input 
              value={editingCategory.name} 
              onChange={e => setEditingCategory({
                ...editingCategory,
                name: e.target.value
              })} 
              className="w-40"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex space-x-1">
              {predefinedColors.slice(0, 5).map(color => (
                <motion.button 
                  key={color} 
                  className={`w-6 h-6 rounded-full border-2 ${editingCategory.color === color ? 'border-gray-800' : 'border-gray-300'}`} 
                  style={{ backgroundColor: color }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory({ ...editingCategory, color });
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <span className="font-medium">{category.name}</span>
            {category.is_default && (
              <Badge variant="secondary" className="text-xs">
                Padrão
              </Badge>
            )}
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {editingId === category.id ? (
          <>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleSaveEdit(category.id); }}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }}>
              <Edit2 className="h-4 w-4" />
            </Button>
            {!category.is_default && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }} 
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
  if (loading) {
    return <div className="flex justify-center p-8">Carregando categorias...</div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Categorias</h3>
          <p className="text-sm text-muted-foreground">
            Organize suas transações com categorias personalizadas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveDuplicates}
          disabled={loading || categories.length === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remover Duplicatas
        </Button>
      </div>

      

      <div className="grid gap-6 md:grid-cols-2">
        {/* Categorias de Receita */}
        <motion.div
          animate={{
            scale: dragOverType === 'income' && draggedCategory?.type !== 'income' ? 1.02 : 1,
            boxShadow: dragOverType === 'income' && draggedCategory?.type !== 'income' 
              ? "0 0 20px rgba(34, 197, 94, 0.3)" 
              : "none"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <Card
            onDragOver={(e) => handleDragOver(e, 'income')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'income')}
            className={`transition-colors duration-300 ${
              dragOverType === 'income' && draggedCategory?.type !== 'income'
                ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20'
                : ''
            }`}
          >
            <CardHeader>
              <CardTitle className="text-green-600">Categorias de Receita</CardTitle>
              <CardDescription>
                Categorias para organizar suas fontes de renda
                <AnimatePresence>
                  {draggedCategory && draggedCategory.type !== 'income' && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="block text-xs text-green-600 mt-1"
                    >
                      Arraste aqui para mover para Receita
                    </motion.span>
                  )}
                </AnimatePresence>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 min-h-[100px]">
              <AnimatePresence mode="popLayout">
                {incomeCategories.length === 0 && !draggedCategory && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground text-center py-4"
                  >
                    Nenhuma categoria de receita
                  </motion.p>
                )}
                {incomeCategories.map((category: Category) => (
                  <CategoryItem key={category.id} category={category} />
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Categorias de Despesa */}
        <motion.div
          animate={{
            scale: dragOverType === 'expense' && draggedCategory?.type !== 'expense' ? 1.02 : 1,
            boxShadow: dragOverType === 'expense' && draggedCategory?.type !== 'expense' 
              ? "0 0 20px rgba(239, 68, 68, 0.3)" 
              : "none"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <Card
            onDragOver={(e) => handleDragOver(e, 'expense')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'expense')}
            className={`transition-colors duration-300 ${
              dragOverType === 'expense' && draggedCategory?.type !== 'expense'
                ? 'ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20'
                : ''
            }`}
          >
            <CardHeader>
              <CardTitle className="text-red-600">Categorias de Despesa</CardTitle>
              <CardDescription>
                Categorias para organizar seus gastos
                <AnimatePresence>
                  {draggedCategory && draggedCategory.type !== 'expense' && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="block text-xs text-red-600 mt-1"
                    >
                      Arraste aqui para mover para Despesa
                    </motion.span>
                  )}
                </AnimatePresence>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 min-h-[100px]">
              <AnimatePresence mode="popLayout">
                {expenseCategories.length === 0 && !draggedCategory && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground text-center py-4"
                  >
                    Nenhuma categoria de despesa
                  </motion.p>
                )}
                {expenseCategories.map((category: Category) => (
                  <CategoryItem key={category.id} category={category} />
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Separator />

      {/* Formulário para adicionar nova categoria */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Nova Categoria</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {showAddForm ? 'Cancelar' : 'Adicionar'}
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nome da Categoria</Label>
                <Input id="category-name" placeholder="Ex: Freelance, Compras, etc." value={newCategory.name} onChange={e => setNewCategory({
              ...newCategory,
              name: e.target.value
            })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-type">Tipo</Label>
                <Select value={newCategory.type} onValueChange={(value: 'income' | 'expense') => setNewCategory({
              ...newCategory,
              type: value
            })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Cor da Categoria</Label>
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map(color => <button key={color} className={`w-8 h-8 rounded-full border-2 ${newCategory.color === color ? 'border-gray-800' : 'border-gray-300'}`} style={{
              backgroundColor: color
            }} onClick={() => setNewCategory({
              ...newCategory,
              color
            })} />)}
              </div>
            </div>
            
            <Button onClick={handleAddCategory} className="w-full">
              Criar Categoria
            </Button>
          </CardContent>}
      </Card>
    </div>;
};
export default CategorySettings;