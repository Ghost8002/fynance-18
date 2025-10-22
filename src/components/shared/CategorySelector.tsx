import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  categories: any[];
  type?: 'income' | 'expense' | 'all';
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
}

const CategorySelector = ({
  value,
  onChange,
  categories,
  type = 'all',
  placeholder = "Selecione uma categoria",
  className = "",
  isMobile = false
}: CategorySelectorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localCategories, setLocalCategories] = useState<any[]>(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Filter categories based on type
  const filteredCategories = localCategories.filter((category) => {
    if (type === 'income') {
      return category.type === "income";
    } else if (type === 'expense') {
      return category.type === "expense";
    }
    return true; // Show all if type is not set
  });

  // Sort categories: default categories first, then by sort_order, then by name
  const sortedCategories = filteredCategories.sort((a, b) => {
    // Default categories first
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;

    // Then by sort_order
    const sortOrderA = a.sort_order || 0;
    const sortOrderB = b.sort_order || 0;
    if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;

    // Finally by name
    return a.name.localeCompare(b.name);
  });

  const selectedCategory = localCategories.find((c) => c.id === value);

  const handleCreateCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }

    if (type === 'all') {
      toast({ title: "Tipo de categoria", description: "Selecione o tipo de categoria antes de criar.", variant: "destructive" });
      return;
    }

    try {
      const { getRandomColor } = await import('@/utils/colorGenerator');
      const randomColor = getRandomColor();
      
      const { data, error } = await supabase
        .from("categories")
        .insert([{ user_id: user.id, name: trimmed, type: type, color: randomColor }])
        .select()
        .limit(1);

      if (error) throw error;
      const newCat = data?.[0];
      if (newCat) {
        setLocalCategories((prev) => [...prev, newCat]);
        onChange(newCat.id);
        toast({ title: "Categoria criada", description: `"${trimmed}" adicionada com sucesso.` });
        setOpen(false);
      }
    } catch (err) {
      console.error("Erro ao criar categoria:", err);
      toast({ title: "Erro", description: "Não foi possível criar a categoria.", variant: "destructive" });
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
        >
          {selectedCategory
            ? selectedCategory.name
            : sortedCategories.length > 0
              ? placeholder
              : type === "income"
                ? "Nenhuma categoria de receita encontrada"
                : type === "expense"
                  ? "Nenhuma categoria de despesa encontrada"
                  : "Selecione uma categoria"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`w-[--radix-popover-trigger-width] p-0 ${isMobile ? 'max-h-48' : ''}`} align="start" side="bottom">
        <Command
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const exists = sortedCategories.some(
                (c: any) => c.name.toLowerCase() === query.trim().toLowerCase()
              );
              if (query.trim() && !exists) {
                handleCreateCategory(query);
              }
            }
          }}
        >
          <CommandInput
            placeholder="Buscar ou criar categoria..."
            value={query}
            onValueChange={setQuery}
            className={`${isMobile ? 'h-8 text-xs' : ''}`}
          />
          <CommandList className={`${isMobile ? 'max-h-32' : ''}`}>
            <CommandEmpty className={`${isMobile ? 'text-xs py-2' : ''}`}>Nenhuma categoria encontrada.</CommandEmpty>

            {query.trim() &&
              !sortedCategories.some(
                (c: any) => c.name.toLowerCase() === query.trim().toLowerCase()
              ) && (
                <CommandGroup>
                  <CommandItem
                    value={`__create_${query}`}
                    onSelect={() => handleCreateCategory(query)}
                    className={`cursor-pointer ${isMobile ? 'text-xs py-1.5' : ''}`}
                  >
                    Criar "{query.trim()}"
                  </CommandItem>
                </CommandGroup>
              )}

            {sortedCategories.length > 0 && (
              <CommandGroup>
                {sortedCategories.map((category: any) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => {
                      onChange(category.id);
                      setOpen(false);
                    }}
                    className={`cursor-pointer ${isMobile ? 'text-xs py-1.5' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`}
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                      {category.is_default && (
                        <span className={`text-xs text-muted-foreground ${isMobile ? 'text-[10px]' : ''}`}>(Padrão)</span>
                      )}
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

export default CategorySelector;
