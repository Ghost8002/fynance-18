
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TransactionFormFieldsProps {
  formData: {
    description: string;
    amount: string;
    category_id: string;
    date: string;
    notes: string;
    type: string;
  };
  categories: any[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  isMobile?: boolean;
}

const TransactionFormFields = ({
  formData,
  categories,
  onInputChange,
  onSelectChange,
  isMobile = false,
}: TransactionFormFieldsProps) => {
  // Local state to support dynamic category creation and search
  const { user } = useAuth();
  const { toast } = useToast();
  const [openCategory, setOpenCategory] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [localCategories, setLocalCategories] = useState<any[]>(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Filter categories based on transaction type
  const filteredCategories = localCategories.filter((category) => {
    if (formData.type === "income") {
      return category.type === "income";
    } else if (formData.type === "expense") {
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

  const selectedCategory = localCategories.find((c) => c.id === formData.category_id);

  const handleCreateCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }

    if (!formData.type) {
      toast({ title: "Tipo de transação", description: "Selecione o tipo antes de criar a categoria.", variant: "destructive" });
      return;
    }

    try {
      const { getRandomColor } = await import('@/utils/colorGenerator');
      const randomColor = getRandomColor();
      
      const { data, error } = await supabase
        .from("categories")
        .insert([{ user_id: user.id, name: trimmed, type: formData.type, color: randomColor }])
        .select()
        .limit(1);

      if (error) throw error;
      const newCat = data?.[0];
      if (newCat) {
        setLocalCategories((prev) => [...prev, newCat]);
        onSelectChange("category_id", newCat.id);
        toast({ title: "Categoria criada", description: `“${trimmed}” adicionada com sucesso.` });
        setOpenCategory(false);
      }
    } catch (err) {
      console.error("Erro ao criar categoria:", err);
      toast({ title: "Erro", description: "Não foi possível criar a categoria.", variant: "destructive" });
    }
  };

  return (
    <>
      <div className={`${isMobile ? 'space-y-1 sm:space-y-1.5' : 'space-y-2'}`}>
        <Label htmlFor="description" className={`${isMobile ? 'text-xs' : ''}`}>Descrição *</Label>
        <Input
          id="description"
          name="description"
          type="text"
          placeholder="Ex: Compra no supermercado"
          value={formData.description}
          onChange={onInputChange}
          required
          className={`${isMobile ? 'h-8 text-xs' : ''}`}
        />
      </div>

      <div className={`${isMobile ? 'space-y-1 sm:space-y-1.5' : 'space-y-2'}`}>
        <Label htmlFor="amount" className={`${isMobile ? 'text-xs' : ''}`}>Valor *</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0,00"
          value={formData.amount}
          onChange={onInputChange}
          required
          className={`${isMobile ? 'h-8 text-xs' : ''}`}
        />
      </div>

      <div className={`${isMobile ? 'space-y-1 sm:space-y-1.5' : 'space-y-2'}`}>
        <Label htmlFor="category_id" className={`${isMobile ? 'text-xs' : ''}`}>Categoria *</Label>
        <Popover open={openCategory} onOpenChange={setOpenCategory}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={openCategory}
              className={`w-full justify-between ${isMobile ? 'h-8 text-xs' : ''}`}
           >
              {selectedCategory
                ? selectedCategory.name
                : sortedCategories.length > 0
                  ? "Selecione uma categoria"
                  : formData.type === "income"
                    ? "Nenhuma categoria de receita encontrada"
                    : formData.type === "expense"
                      ? "Nenhuma categoria de despesa encontrada"
                      : "Selecione o tipo de transação primeiro"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className={`w-[--radix-popover-trigger-width] p-0 ${isMobile ? 'max-h-48' : ''}`} align="start" side="bottom">
            <Command
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const exists = sortedCategories.some(
                    (c: any) => c.name.toLowerCase() === categoryQuery.trim().toLowerCase()
                  );
                  if (categoryQuery.trim() && !exists) {
                    handleCreateCategory(categoryQuery);
                  }
                }
              }}
            >
              <CommandInput
                placeholder="Buscar ou criar categoria..."
                value={categoryQuery}
                onValueChange={setCategoryQuery}
                className={`${isMobile ? 'h-8 text-xs' : ''}`}
              />
              <CommandList className={`${isMobile ? 'max-h-32' : ''}`}>
                <CommandEmpty className={`${isMobile ? 'text-xs py-2' : ''}`}>Nenhuma categoria encontrada.</CommandEmpty>

                {categoryQuery.trim() &&
                  !sortedCategories.some(
                    (c: any) => c.name.toLowerCase() === categoryQuery.trim().toLowerCase()
                  ) && (
                    <CommandGroup>
                      <CommandItem
                        value={`__create_${categoryQuery}`}
                        onSelect={() => handleCreateCategory(categoryQuery)}
                        className={`cursor-pointer ${isMobile ? 'text-xs py-1.5' : ''}`}
                      >
                        Criar "{categoryQuery.trim()}"
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
                          onSelectChange("category_id", category.id);
                          setOpenCategory(false);
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
      </div>

      <div className={`${isMobile ? 'space-y-1 sm:space-y-1.5' : 'space-y-2'}`}>
        <Label htmlFor="date" className={`${isMobile ? 'text-xs' : ''}`}>Data *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={onInputChange}
          required
          className={`${isMobile ? 'h-8 text-xs' : ''}`}
        />
      </div>

      <div className={`${isMobile ? 'space-y-1 sm:space-y-1.5' : 'space-y-2'}`}>
        <Label htmlFor="notes" className={`${isMobile ? 'text-xs' : ''}`}>Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Observações adicionais (opcional)"
          value={formData.notes}
          onChange={onInputChange}
          rows={isMobile ? 2 : 3}
          className={`${isMobile ? 'text-xs min-h-[60px]' : ''}`}
        />
      </div>
    </>
  );
};

export default TransactionFormFields;
