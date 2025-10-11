import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar, ArrowUpDown, FileText, XCircle } from "lucide-react";

interface CardTransactionsProps {
  cardId: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  category_id: string;
  installments_count: number;
  installment_number: number;
  notes: string;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export const CardTransactions = ({ cardId }: CardTransactionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: transactions, loading: loadingTransactions, refetch: refetchTransactions, remove: removeTransaction } = useSupabaseData('transactions', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: cards, update: updateCard, refetch: refetchCards } = useSupabaseData('cards', user?.id);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [cancelingTransaction, setCancelingTransaction] = useState<Transaction | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCategoryName = (categoryId: string) => {
    const category = (categories as Category[])?.find(cat => cat.id === categoryId);
    return category?.name || "Sem categoria";
  };

  const getCategoryColor = (categoryId: string) => {
    const category = (categories as Category[])?.find(cat => cat.id === categoryId);
    return category?.color || "#6B7280";
  };

  // Filtrar transações do cartão
  const cardTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return (transactions as any[])
      .filter(transaction => transaction.card_id === cardId)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [transactions, cardId, sortOrder]);

  // Aplicar filtros
  const filteredTransactions = useMemo(() => {
    let filtered = cardTransactions;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(transaction.category_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (selectedCategory !== "all") {
      filtered = filtered.filter(transaction => transaction.category_id === selectedCategory);
    }

    // Filtro por período
    if (selectedPeriod !== "all") {
      const today = new Date();
      let startDate: Date;

      switch (selectedPeriod) {
        case "this_month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case "last_month":
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
          filtered = filtered.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate && transactionDate <= endDate;
          });
          return filtered;
        case "last_3_months":
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
          break;
        default:
          return filtered;
      }

      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate;
      });
    }

    return filtered;
  }, [cardTransactions, searchTerm, selectedCategory, selectedPeriod]);

  const handleCancelTransaction = async () => {
    if (!cancelingTransaction) return;

    try {
      const card = cards?.find(c => c.id === cardId);
      if (!card) {
        toast({
          title: "Erro",
          description: "Cartão não encontrado",
          variant: "destructive",
        });
        return;
      }

      // Restaurar o limite do cartão
      const transactionAmount = Math.abs(cancelingTransaction.amount);
      const newUsedAmount = Math.max(0, Number(card.used_amount) - transactionAmount);

      await updateCard(cardId, { used_amount: newUsedAmount });

      // Deletar a transação
      await removeTransaction(cancelingTransaction.id);

      await refetchTransactions();
      await refetchCards();

      toast({
        title: "Transação cancelada",
        description: "O limite do cartão foi restaurado com sucesso",
      });

      setShowCancelDialog(false);
      setCancelingTransaction(null);
    } catch (error) {
      console.error('Erro ao cancelar transação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a transação",
        variant: "destructive",
      });
    }
  };

  // Estatísticas
  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const transactionCount = filteredTransactions.length;
  const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;

  if (loadingTransactions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p>Carregando transações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactionCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Filtros de Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {(categories as Category[])?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os períodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="this_month">Este mês</SelectItem>
                <SelectItem value="last_month">Mês passado</SelectItem>
                <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Mais recentes
                  </div>
                </SelectItem>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Mais antigos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações do Cartão</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
              <p className="text-muted-foreground">
                {cardTransactions.length === 0 
                  ? "Este cartão ainda não possui transações registradas."
                  : "Tente ajustar os filtros para encontrar as transações desejadas."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.notes && (
                          <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                        )}
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {transaction.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {transaction.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{transaction.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(transaction.category_id) }}
                        />
                        {getCategoryName(transaction.category_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(transaction.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.installments_count > 1 ? (
                        <Badge variant="outline">
                          {transaction.installment_number}/{transaction.installments_count}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">À vista</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCancelingTransaction(transaction);
                          setShowCancelDialog(true);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá cancelar a transação "{cancelingTransaction?.description}" no valor de{" "}
              {cancelingTransaction && formatCurrency(Math.abs(cancelingTransaction.amount))}.
              O limite do cartão será restaurado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelingTransaction(null)}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTransaction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancelar Transação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};