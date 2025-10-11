
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Edit, Trash2, Check, X, Loader2 } from "lucide-react";
import { parseLocalDate } from "@/utils/dateValidation";

interface TransactionTableRowProps {
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

const TransactionTableRow = ({ 
  transaction, 
  categoryMap, 
  accountMap, 
  cardMap, 
  onUpdate, 
  onDelete 
}: TransactionTableRowProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = () => {
    setEditingId(transaction.id);
    setEditingData({
      description: transaction.description,
      amount: transaction.amount.toString(),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingData.description || !editingData.amount) {
      return;
    }

    try {
      setUpdatingId(transaction.id);
      
      const { error } = await onUpdate(transaction.id, {
        description: editingData.description,
        amount: parseFloat(editingData.amount),
      });

      if (!error) {
        setEditingId(null);
        setEditingData({});
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = async () => {
    try {
      setDeletingId(transaction.id);
      await onDelete(transaction.id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {editingId === transaction.id ? (
          <Input
            value={editingData.description}
            onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
            className="min-w-40"
          />
        ) : (
          transaction.description
        )}
      </TableCell>
      <TableCell>{formatDate(transaction.date)}</TableCell>
      <TableCell className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
        {editingId === transaction.id ? (
          <Input
            type="number"
            step="0.01"
            value={editingData.amount}
            onChange={(e) => setEditingData(prev => ({ ...prev, amount: e.target.value }))}
            className="min-w-32"
          />
        ) : (
          formatCurrency(Number(transaction.amount))
        )}
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
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
          {editingId === transaction.id ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveEdit}
                disabled={updatingId === transaction.id}
                className="h-8 w-8 p-0"
              >
                {updatingId === transaction.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                disabled={updatingId === transaction.id}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4 text-gray-600" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
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
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TransactionTableRow;
