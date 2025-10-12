
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Edit, Trash2, Loader2, Check, X } from "lucide-react";
import { parseLocalDate } from "@/utils/dateValidation";
import TransactionEditForm from "./TransactionEditForm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface TransactionTableRowProps {
  transaction: any;
  categoryMap: Record<string, any>;
  accountMap: Record<string, string>;
  cardMap: Record<string, string>;
  categories: any[];
  onUpdate: (id: string, data: any) => Promise<{ error?: string }>;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return parseLocalDate(dateString).toLocaleDateString('pt-BR', options);
};

const TransactionTableRow = ({ 
  transaction, 
  categoryMap, 
  accountMap, 
  cardMap,
  categories,
  onUpdate, 
  onDelete 
}: TransactionTableRowProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
  };

  const handleDelete = async () => {
    try {
      setDeletingId(transaction.id);
      await onDelete(transaction.id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .eq('id', transaction.id);

      if (error) throw error;

      await onUpdate(transaction.id, { category_id: categoryId });
      setCategoryPopoverOpen(false);
      setCategoryQuery("");
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ user_id: user.id, name: trimmed, type: transaction.type }])
        .select()
        .limit(1);

      if (error) throw error;
      const newCat = data?.[0];
      if (newCat) {
        await handleCategoryChange(newCat.id);
        toast({ title: "Categoria criada", description: `"${trimmed}" adicionada com sucesso.` });
      }
    } catch (err) {
      console.error("Erro ao criar categoria:", err);
      toast({ title: "Erro", description: "Não foi possível criar a categoria.", variant: "destructive" });
    }
  };

  const handleTagsChange = async (tagIds: string[]) => {
    try {
      // Fetch tag details
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds);

      if (tagsError) throw tagsError;

      const { error } = await supabase
        .from('transactions')
        .update({ tags: tagsData || [] })
        .eq('id', transaction.id);

      if (error) throw error;

      await onUpdate(transaction.id, { tags: tagsData || [] });
      toast({
        title: "Tags atualizadas",
        description: "As tags foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as tags.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTag = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }

    try {
      const defaultColor = "#8884d8";
      const { data, error } = await supabase
        .from("tags")
        .insert([{ user_id: user.id, name: trimmed, color: defaultColor, is_active: true }])
        .select()
        .limit(1);

      if (error) throw error;
      const newTag = data?.[0];
      if (newTag) {
        const currentTagIds = transaction.tags?.map((t: any) => t.id) || [];
        await handleTagsChange([...currentTagIds, newTag.id]);
        setTagQuery("");
        toast({ title: "Tag criada", description: `"${trimmed}" adicionada com sucesso.` });
      }
    } catch (err) {
      console.error("Erro ao criar tag:", err);
      toast({ title: "Erro", description: "Não foi possível criar a tag.", variant: "destructive" });
    }
  };

  const handleTagToggle = (tagId: string) => {
    const currentTagIds = transaction.tags?.map((t: any) => t.id) || [];
    if (currentTagIds.includes(tagId)) {
      handleTagsChange(currentTagIds.filter((id: string) => id !== tagId));
    } else {
      handleTagsChange([...currentTagIds, tagId]);
    }
  };

  // Filter and sort categories
  const filteredCategories = categories.filter((category) => 
    category.type === transaction.type
  ).sort((a, b) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    const sortOrderA = a.sort_order || 0;
    const sortOrderB = b.sort_order || 0;
    if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;
    return a.name.localeCompare(b.name);
  });

  // Get active tags
  const activeTags = categories.reduce((acc: any[], cat) => {
    return acc;
  }, []);

  // Fetch tags for display
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  
  useState(() => {
    const fetchTags = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('tags')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');
        if (data) setAvailableTags(data);
      }
    };
    fetchTags();
  });

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          {transaction.description}
        </TableCell>
        <TableCell>{formatDate(transaction.date)}</TableCell>
        <TableCell className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
          {formatCurrency(Number(transaction.amount))}
        </TableCell>
      <TableCell>
        <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="cursor-pointer inline-block">
              {transaction.category_id && categoryMap[transaction.category_id] ? (
                <Badge 
                  variant="outline"
                  style={{ 
                    backgroundColor: `${categoryMap[transaction.category_id].color}20`, 
                    borderColor: categoryMap[transaction.category_id].color,
                    color: categoryMap[transaction.category_id].color
                  }}
                >
                  {categoryMap[transaction.category_id].name}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Sem categoria
                </Badge>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const exists = filteredCategories.some(
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
              />
              <CommandList>
                <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>

                {categoryQuery.trim() &&
                  !filteredCategories.some(
                    (c: any) => c.name.toLowerCase() === categoryQuery.trim().toLowerCase()
                  ) && (
                    <CommandGroup>
                      <CommandItem
                        value={`__create_${categoryQuery}`}
                        onSelect={() => handleCreateCategory(categoryQuery)}
                        className="cursor-pointer"
                      >
                        Criar "{categoryQuery.trim()}"
                      </CommandItem>
                    </CommandGroup>
                  )}

                {filteredCategories.length > 0 && (
                  <CommandGroup>
                    {filteredCategories.map((category: any) => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => handleCategoryChange(category.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                          {category.is_default && (
                            <span className="text-xs text-muted-foreground">(Padrão)</span>
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
      </TableCell>
      <TableCell>
        <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="cursor-pointer flex flex-wrap gap-1">
              {transaction.tags && transaction.tags.length > 0 ? (
                transaction.tags.map((tag: any) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      borderColor: tag.color,
                      color: tag.color
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Sem tags</span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const exists = availableTags.some(
                    (t) => t.name.toLowerCase() === tagQuery.trim().toLowerCase()
                  );
                  if (tagQuery.trim() && !exists) {
                    handleCreateTag(tagQuery);
                  }
                }
              }}
            >
              <CommandInput
                placeholder="Buscar ou criar tag..."
                value={tagQuery}
                onValueChange={setTagQuery}
              />
              <CommandList>
                <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>

                {tagQuery.trim() &&
                  !availableTags.some(
                    (t) => t.name.toLowerCase() === tagQuery.trim().toLowerCase()
                  ) && (
                    <CommandGroup>
                      <CommandItem
                        value={`__create_${tagQuery}`}
                        onSelect={() => handleCreateTag(tagQuery)}
                        className="cursor-pointer"
                      >
                        Criar "{tagQuery.trim()}"
                      </CommandItem>
                    </CommandGroup>
                  )}

                {availableTags.length > 0 && (
                  <CommandGroup>
                    {availableTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => handleTagToggle(tag.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            transaction.tags?.some((t: any) => t.id === tag.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell>
        {transaction.account_id 
          ? accountMap[transaction.account_id] || 'Conta removida'
          : transaction.card_id 
          ? cardMap[transaction.card_id] || 'Cartão removido'
          : 'N/A'
        }
      </TableCell>
      <TableCell>
        {transaction.type === "income" ? (
          <div className="flex items-center gap-1 text-green-600">
            <ArrowUpCircle size={16} />
            <span>Receita</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600">
            <ArrowDownCircle size={16} />
            <span>Despesa</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditDialogOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={deletingId === transaction.id}
            className="h-8 w-8 p-0"
          >
            {deletingId === transaction.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-red-600" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>

    <TransactionEditForm
      transaction={transaction}
      isOpen={isEditDialogOpen}
      onClose={() => setIsEditDialogOpen(false)}
      onSuccess={handleEditSuccess}
    />
    </>
  );
};

export default TransactionTableRow;
