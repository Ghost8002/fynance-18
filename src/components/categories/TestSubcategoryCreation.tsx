import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import SubcategorySelect from '@/components/transactions/SubcategorySelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TestSubcategoryCreation = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('cat1'); // ID de categoria de exemplo
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  // Categorias de exemplo para teste
  const mockCategories = [
    { id: 'cat1', name: 'Alimentação' },
    { id: 'cat2', name: 'Transporte' },
    { id: 'cat3', name: 'Lazer' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Teste de Criação de Subcategorias</h1>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <select 
            id="category"
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {mockCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Subcategoria (com criação dinâmica)</Label>
          {selectedCategory && (
            <SubcategorySelect 
              categoryId={selectedCategory}
              value={selectedSubcategory}
              onValueChange={setSelectedSubcategory}
            />
          )}
        </div>

        {selectedSubcategory && (
          <div className="p-4 bg-green-100 rounded">
            <p>Subcategoria selecionada: {selectedSubcategory}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSubcategoryCreation;