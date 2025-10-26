import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/shared/AppLayout';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, ArrowLeft } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import SubcategoryManager from '@/components/categories/SubcategoryManager';

const Subcategories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: categories } = useSupabaseData('categories', user?.id);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/categories')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Subcategorias</h1>
              <p className="text-muted-foreground">
                Gerencie subcategorias para organizar melhor suas transações
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:w-64">
              <label className="text-sm font-medium mb-1 block">Selecione uma categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color || '#9CA3AF' }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCategory && (
              <Button 
                onClick={() => navigate(`/categories/${selectedCategory}`)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Subcategoria
              </Button>
            )}
          </div>

          {selectedCategory ? (
            <SubcategoryManager categoryId={selectedCategory} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Selecione uma categoria para gerenciar suas subcategorias
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Subcategories;