
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { parseLocalDate } from "@/utils/dateValidation";
import TransactionEditForm from "./TransactionEditForm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CategorySelector from "@/components/shared/CategorySelector";
import TagSelector from "@/components/shared/TagSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
      setTagsPopoverOpen(false);
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
            <CategorySelector
              value={transaction.category_id || ""}
              onChange={handleCategoryChange}
              categories={categories}
              type={transaction.type}
              placeholder="Selecione uma categoria"
            />
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
          <PopoverContent className="w-80 p-4" align="start">
            <TagSelector
              selectedTags={transaction.tags?.map((t: any) => t.id) || []}
              onTagsChange={handleTagsChange}
            />
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
