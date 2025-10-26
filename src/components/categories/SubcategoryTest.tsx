import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubcategories } from '@/hooks/useSubcategories';
import SubcategoryManager from './SubcategoryManager';
import SubcategorySelect from '../transactions/SubcategorySelect';

const SubcategoryTest = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Mock categories for testing
  const mockCategories = [
    { id: 'cat1', name: 'Alimentação', color: '#FF6B6B' },
    { id: 'cat2', name: 'Transporte', color: '#4ECDC4' },
    { id: 'cat3', name: 'Lazer', color: '#45B7D1' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Teste de Subcategorias</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Selecione uma Categoria</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione uma categoria</option>
            {mockCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Gerenciador de Subcategorias</h2>
              <SubcategoryManager categoryId={selectedCategory} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Seleção de Subcategoria</h2>
              <SubcategorySelect 
                categoryId={selectedCategory}
                value={selectedSubcategory}
                onValueChange={setSelectedSubcategory}
              />
              {selectedSubcategory && (
                <p className="mt-2">Subcategoria selecionada: {selectedSubcategory}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubcategoryTest;