import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Edit, Trash2, Loader2, MoreVertical } from "lucide-react";
import { parseLocalDate } from "@/utils/dateValidation";
import TransactionEditForm from "../TransactionEditForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TransactionCardMobileProps {
  transaction: any;
  categoryMap: Record<string, any>;
  accountMap: Record<string, string>;
  cardMap: Record<string, string>;
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

const TransactionCardMobile = ({ 
  transaction, 
  categoryMap, 
  accountMap, 
  cardMap,
  onUpdate, 
  onDelete 
}: TransactionCardMobileProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
  };

  const handleDelete = async () => {
    try {
      setDeletingId(transaction.id);
      await onDelete(transaction.id);
      setIsDeleteDialogOpen(false);
    } finally {
      setDeletingId(null);
    }
  };

  const isIncome = transaction.type === "income";
  const category = transaction.category_id ? categoryMap[transaction.category_id] : null;
  const paymentMethod = transaction.account_id 
    ? accountMap[transaction.account_id] || 'Conta removida'
    : transaction.card_id 
    ? cardMap[transaction.card_id] || 'Cartão removido'
    : 'N/A';

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{transaction.description}</h4>
            <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`font-semibold text-sm whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Number(transaction.amount))}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type badge */}
          <div className={`flex items-center gap-1 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
            <span>{isIncome ? 'Receita' : 'Despesa'}</span>
          </div>

          <span className="text-muted-foreground">•</span>

          {/* Category */}
          {category ? (
            <Badge 
              variant="outline"
              className="text-xs h-5 px-1.5"
              style={{ 
                backgroundColor: `${category.color}20`, 
                borderColor: category.color,
                color: category.color
              }}
            >
              {category.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">Sem categoria</span>
          )}

          <span className="text-muted-foreground">•</span>

          {/* Payment method */}
          <span className="text-muted-foreground truncate">{paymentMethod}</span>
        </div>

        {/* Tags */}
        {transaction.tags && transaction.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {transaction.tags.map((tag: any) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs h-5 px-1.5"
                style={{
                  backgroundColor: `${tag.color}20`,
                  borderColor: tag.color,
                  color: tag.color
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Notes */}
        {transaction.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{transaction.notes}</p>
        )}
      </div>

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <TransactionEditForm
          transaction={transaction}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir a transação "{transaction.description}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingId === transaction.id}
              className="h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId === transaction.id ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TransactionCardMobile;
