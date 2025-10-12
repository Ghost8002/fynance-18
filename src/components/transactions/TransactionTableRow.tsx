
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { parseLocalDate } from "@/utils/dateValidation";
import TransactionEditForm from "./TransactionEditForm";
import CategorySelector from "@/components/shared/CategorySelector";
import { TagSelector } from "@/components/shared/TagSelector";
import { useTags, Tag } from "@/hooks/useTags";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const { tags: allTags, fetchTags } = useTags();
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

  const handleCategoryChange = async (categoryId: string | null) => {
    setUpdatingField('category');
    try {
      const result = await onUpdate(transaction.id, { category_id: categoryId });
      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Categoria atualizada!",
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria.",
        variant: "destructive",
      });
    } finally {
      setUpdatingField(null);
    }
  };

  const handleTagsChange = async (selectedTags: Tag[]) => {
    setUpdatingField('tags');
    try {
      // Convert tags to JSON-compatible format
      const tagsJson = selectedTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        user_id: tag.user_id,
        is_active: tag.is_active,
        created_at: tag.created_at,
        updated_at: tag.updated_at
      }));

      // Update transaction with new tags
      const { error } = await supabase
        .from('transactions')
        .update({ tags: tagsJson })
        .eq('id', transaction.id);

      if (error) throw error;

      // Trigger refetch
      window.dispatchEvent(new CustomEvent('transactionWithTagsAdded'));
      
      toast({
        title: "Sucesso",
        description: "Tags atualizadas!",
      });
    } catch (error) {
      console.error("Error updating tags:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as tags.",
        variant: "destructive",
      });
    } finally {
      setUpdatingField(null);
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
      <TableCell onClick={(e) => e.stopPropagation()}>
        <CategorySelector
          value={transaction.category_id || ""}
          onChange={handleCategoryChange}
          categories={categories}
          type={transaction.type}
          placeholder="Selecionar categoria..."
          className="w-full min-w-[150px]"
        />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <TagSelector
          value={transaction.tags || []}
          onChange={handleTagsChange}
          allTags={allTags}
          onTagCreated={fetchTags}
          placeholder="Selecionar tags..."
          className="w-full min-w-[150px]"
        />
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
