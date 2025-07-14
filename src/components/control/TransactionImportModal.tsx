
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Import, Calendar, DollarSign } from 'lucide-react';
import { useTransactionsPaginated } from '@/hooks/useTransactionsPaginated';
import { format } from 'date-fns';

interface TransactionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: any[]) => void;
}

export const TransactionImportModal = ({ isOpen, onClose, onImport }: TransactionImportModalProps) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  
  const { transactions, loading } = useTransactionsPaginated(
    {
      type: '',
      category: '',
      account: '',
      card: '',
      tags: [],
      dateRange: { from: undefined, to: undefined },
      amountRange: { min: undefined, max: undefined },
      description: ''
    },
    100
  );

  const handleTransactionSelect = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t.id));
    }
  };

  const handleImport = () => {
    const transactionsToImport = transactions.filter(t => 
      selectedTransactions.includes(t.id)
    );
    onImport(transactionsToImport);
    setSelectedTransactions([]);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Carregando transações...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Import className="h-5 w-5" />
            Importar Produtos das Transações
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedTransactions.length === transactions.length && transactions.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-finance-text-secondary">
              {selectedTransactions.length} de {transactions.length} selecionadas
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={selectedTransactions.length === 0}
              className="bg-finance-primary hover:bg-finance-primary/90"
            >
              <Import className="mr-2 h-4 w-4" />
              Importar {selectedTransactions.length} transações
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-finance-background-secondary/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={() => handleTransactionSelect(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-finance-text-tertiary" />
                      {format(new Date(transaction.date), 'dd/MM/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {transaction.category?.name || 'Sem categoria'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 font-medium ${
                      transaction.type === 'income' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      <DollarSign className="h-4 w-4" />
                      R$ {Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.type === 'income' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {transactions.length === 0 && (
            <div className="text-center py-8 text-finance-text-secondary">
              Nenhuma transação encontrada
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
