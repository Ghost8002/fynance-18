
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Import, Calendar, DollarSign } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface TransactionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: any[]) => void;
}

export const TransactionImportModal = ({ isOpen, onClose, onImport }: TransactionImportModalProps) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const { user } = useAuth();
  
  // Buscar todas as transações normais
  const { data: transactions, loading: loadingTransactions } = useSupabaseData('transactions', user?.id);
  
  // Buscar pagamentos a receber para incluir na importação
  const { data: receivables, loading: loadingReceivables } = useSupabaseData('receivable_payments', user?.id);
  
  // Buscar dívidas para incluir na importação
  const { data: debts, loading: loadingDebts } = useSupabaseData('debts', user?.id);

  // Buscar dados auxiliares para exibir informações completas
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);

  const loading = loadingTransactions || loadingReceivables || loadingDebts;

  // Criar mapas para facilitar o acesso aos dados
  const categoryMap = categories?.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {} as Record<string, any>) || {};

  const accountMap = accounts?.reduce((acc, account) => {
    acc[account.id] = account;
    return acc;
  }, {} as Record<string, any>) || {};

  // Combinar todas as transações em um formato unificado
  const allTransactions = [
    // Transações normais
    ...(transactions || []).map(transaction => ({
      id: `transaction-${transaction.id}`,
      originalId: transaction.id,
      description: transaction.description,
      amount: Number(transaction.amount),
      date: transaction.date,
      type: transaction.type,
      category: categoryMap[transaction.category_id],
      account: accountMap[transaction.account_id],
      source: 'transaction'
    })),
    // Pagamentos a receber
    ...(receivables || []).map(receivable => ({
      id: `receivable-${receivable.id}`,
      originalId: receivable.id,
      description: receivable.description,
      amount: Number(receivable.amount),
      date: receivable.due_date,
      type: 'income',
      category: categoryMap[receivable.category_id],
      account: accountMap[receivable.account_id],
      source: 'receivable'
    })),
    // Dívidas
    ...(debts || []).map(debt => ({
      id: `debt-${debt.id}`,
      originalId: debt.id,
      description: debt.description,
      amount: Number(debt.amount),
      date: debt.due_date,
      type: 'expense',
      category: categoryMap[debt.category_id],
      account: accountMap[debt.account_id],
      source: 'debt'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleTransactionSelect = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === allTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(allTransactions.map(t => t.id));
    }
  };

  const handleImport = () => {
    const transactionsToImport = allTransactions.filter(t => 
      selectedTransactions.includes(t.id)
    );
    onImport(transactionsToImport);
    setSelectedTransactions([]);
    onClose();
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'transaction':
        return 'Transação';
      case 'receivable':
        return 'A Receber';
      case 'debt':
        return 'Dívida';
      default:
        return source;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'transaction':
        return 'bg-blue-100 text-blue-800';
      case 'receivable':
        return 'bg-green-100 text-green-800';
      case 'debt':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Carregando transações...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              checked={selectedTransactions.length === allTransactions.length && allTransactions.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedTransactions.length} de {allTransactions.length} selecionadas
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
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={() => handleTransactionSelect(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
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
                  <TableCell>
                    <Badge 
                      className={`text-xs ${getSourceColor(transaction.source)}`}
                    >
                      {getSourceLabel(transaction.source)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {allTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
