import React, { useEffect, useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { useSubcategories } from '@/hooks/useSubcategories';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/database';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { devError } from '@/utils/logger';

type Subcategory = Database['public']['Tables']['subcategories']['Row'];

interface SubcategorySelectProps {
  categoryId: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
  onOpenSubcategoryManager?: () => void;
}

const SubcategorySelect: React.FC<SubcategorySelectProps> = ({ 
  categoryId, 
  value, 
  onValueChange,
  onOpenSubcategoryManager
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subcategories, loading, fetchSubcategories, createSubcategory } = useSubcategories({ 
    userId: user?.id, 
    categoryId 
  });
  
  const [openSubcategory, setOpenSubcategory] = useState(false);
  const [subcategoryQuery, setSubcategoryQuery] = useState("");

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories();
    }
  }, [categoryId, fetchSubcategories]);

  // Resetar valor quando a categoria mudar
  useEffect(() => {
    onValueChange(null);
  }, [categoryId, onValueChange]);

  const handleCreateSubcategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }

    if (!categoryId) {
      toast({ title: "Erro", description: "Categoria não selecionada.", variant: "destructive" });
      return;
    }

    try {
      const { getRandomColor } = await import('@/utils/colorGenerator');
      const randomColor = getRandomColor();
      
      const result = await createSubcategory({
        category_id: categoryId,
        name: trimmed,
        color: randomColor,
        sort_order: 0,
      });

      if (result) {
        onValueChange(result.id);
        toast({ title: "Subcategoria criada", description: `“${trimmed}” adicionada com sucesso.` });
        setOpenSubcategory(false);
        setSubcategoryQuery("");
      }
    } catch (err) {
      devError("Erro ao criar subcategoria:", err);
      toast({ title: "Erro", description: "Não foi possível criar a subcategoria.", variant: "destructive" });
    }
  };

  const selectedSubcategory = subcategories.find((s) => s.id === value);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Carregando subcategorias..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Subcategoria</label>
        {onOpenSubcategoryManager && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={onOpenSubcategoryManager}
          >
            <Plus className="h-3 w-3 mr-1" />
            Gerenciar
          </Button>
        )}
      </div>
      
      <Popover open={openSubcategory} onOpenChange={setOpenSubcategory}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={openSubcategory}
            className="w-full justify-between"
          >
            {selectedSubcategory
              ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: selectedSubcategory.color || '#9CA3AF' }}
                  />
                  {selectedSubcategory.name}
                </div>
              )
              : subcategories.length > 0
                ? "Selecione uma subcategoria"
                : "Nenhuma subcategoria disponível"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="bottom">
          <Command
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const exists = subcategories.some(
                  (s) => s.name.toLowerCase() === subcategoryQuery.trim().toLowerCase()
                );
                if (subcategoryQuery.trim() && !exists) {
                  handleCreateSubcategory(subcategoryQuery);
                }
              }
            }}
          >
            <CommandInput
              placeholder="Buscar ou criar subcategoria..."
              value={subcategoryQuery}
              onValueChange={setSubcategoryQuery}
            />
            <CommandList>
              <CommandEmpty>Nenhuma subcategoria encontrada.</CommandEmpty>

              {subcategoryQuery.trim() &&
                !subcategories.some(
                  (s) => s.name.toLowerCase() === subcategoryQuery.trim().toLowerCase()
                ) && (
                <CommandGroup>
                  <CommandItem
                    value={`__create_${subcategoryQuery}`}
                    onSelect={() => handleCreateSubcategory(subcategoryQuery)}
                    className="cursor-pointer"
                  >
                    Criar "{subcategoryQuery.trim()}"
                  </CommandItem>
                </CommandGroup>
              )}

              {subcategories.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => {
                      onValueChange(null);
                      setOpenSubcategory(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Nenhuma
                  </CommandItem>
                  {subcategories.map((subcategory) => (
                    <CommandItem
                      key={subcategory.id}
                      value={subcategory.name}
                      onSelect={() => {
                        onValueChange(subcategory.id);
                        setOpenSubcategory(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === subcategory.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subcategory.color || '#9CA3AF' }}
                        />
                        {subcategory.name}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SubcategorySelect;