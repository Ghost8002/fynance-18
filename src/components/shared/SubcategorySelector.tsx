import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSubcategories } from "@/hooks/useSubcategories";

interface SubcategorySelectorProps {
  categoryId: string;
  value: string;
  onChange: (subcategoryId: string) => void;
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
}

const SubcategorySelector = ({
  categoryId,
  value,
  onChange,
  placeholder = "Selecione uma subcategoria",
  className = "",
  isMobile = false
}: SubcategorySelectorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  
  const { subcategories, loading, fetchSubcategories } = useSubcategories({ 
    userId: user?.id, 
    categoryId 
  });

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories();
    }
  }, [categoryId, fetchSubcategories]);

  // Sort subcategories by sort_order, then by name
  const sortedSubcategories = subcategories.sort((a, b) => {
    // By sort_order
    const sortOrderA = a.sort_order || 0;
    const sortOrderB = b.sort_order || 0;
    if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;

    // Finally by name
    return a.name.localeCompare(b.name);
  });

  const selectedSubcategory = subcategories.find((c) => c.id === value);

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
      
      const { data, error } = await supabase
        .from("subcategories")
        .insert([{
          user_id: user.id, 
          category_id: categoryId,
          name: trimmed, 
          color: randomColor 
        }])
        .select()
        .limit(1);

      if (error) throw error;
      const newSubcat = data?.[0];
      if (newSubcat) {
        // Refresh subcategories list
        fetchSubcategories();
        onChange(newSubcat.id);
        toast({ title: "Subcategoria criada", description: `"${trimmed}" adicionada com sucesso.` });
        setOpen(false);
      }
    } catch (err) {
      console.error("Erro ao criar subcategoria:", err);
      toast({ title: "Erro", description: "Não foi possível criar a subcategoria.", variant: "destructive" });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${isMobile ? 'h-8 text-xs' : ''} ${className}`}
          disabled={loading || !categoryId}
        >
          {loading ? (
            "Carregando..."
          ) : selectedSubcategory ? (
            selectedSubcategory.name
          ) : sortedSubcategories.length > 0 ? (
            placeholder
          ) : (
            "Nenhuma subcategoria disponível"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`w-[--radix-popover-trigger-width] p-0 ${isMobile ? 'max-h-48' : ''}`} align="start" side="bottom">
        <Command
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const exists = sortedSubcategories.some(
                (c: any) => c.name.toLowerCase() === query.trim().toLowerCase()
              );
              if (query.trim() && !exists) {
                handleCreateSubcategory(query);
              }
            }
          }}
        >
          <CommandInput
            placeholder="Buscar ou criar subcategoria..."
            value={query}
            onValueChange={setQuery}
            className={`${isMobile ? 'h-8 text-xs' : ''}`}
          />
          <CommandList className={`${isMobile ? 'max-h-32' : ''}`}>
            <CommandEmpty className={`${isMobile ? 'text-xs py-2' : ''}`}>
              {query.trim() ? "Nenhuma subcategoria encontrada." : "Nenhuma subcategoria disponível."}
            </CommandEmpty>

            {query.trim() &&
              !sortedSubcategories.some(
                (c: any) => c.name.toLowerCase() === query.trim().toLowerCase()
              ) && (
                <CommandGroup>
                  <CommandItem
                    value={`__create_${query}`}
                    onSelect={() => handleCreateSubcategory(query)}
                    className={`cursor-pointer ${isMobile ? 'text-xs py-1.5' : ''}`}
                  >
                    Criar "{query.trim()}"
                  </CommandItem>
                </CommandGroup>
              )}

            {sortedSubcategories.length > 0 && (
              <CommandGroup>
                {sortedSubcategories.map((subcategory: any) => (
                  <CommandItem
                    key={subcategory.id}
                    value={subcategory.name}
                    onSelect={() => {
                      onChange(subcategory.id);
                      setOpen(false);
                    }}
                    className={`cursor-pointer ${isMobile ? 'text-xs py-1.5' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`}
                        style={{ backgroundColor: subcategory.color }}
                      />
                      <span>{subcategory.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SubcategorySelector;