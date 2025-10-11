import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Calendar, CreditCard, Package, FileText, DollarSign, Clock, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { BillPaymentDialog } from "./BillPaymentDialog";
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

interface CardBillProps {
  cardId: string;
  onBillUpdate?: () => void;
}

interface BillData {
  id: string;
  bill_month: number;
  bill_year: number;
  due_date: string;
  closing_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  user_id: string;
  card_id: string;
}

interface InstallmentItem {
  id: string;
  installment_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  description: string;
  installments_count: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category_id?: string;
  category_name?: string;
}

export const CardBill = ({ cardId, onBillUpdate }: CardBillProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [billData, setBillData] = useState<BillData | null>(null);
  const [installmentItems, setInstallmentItems] = useState<InstallmentItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'installment'>('full');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const fetchBillData = async () => {
    if (!user?.id || !cardId) return;

    try {
      setLoading(true);

      // Buscar ou criar fatura
      let { data: bill, error: billError } = await supabase
        .from('card_bills')
        .select('*')
        .eq('card_id', cardId)
        .eq('bill_month', currentMonth)
        .eq('bill_year', currentYear)
        .maybeSingle();

      if (billError) {
        console.error('Erro ao buscar fatura:', billError);
        toast({
          variant: "destructive",
          title: "Erro ao carregar fatura"
        });
        return;
      }

      // Se não existe fatura, gerar uma nova
      if (!bill) {
        const { data: generatedBill, error: generateError } = await supabase
          .rpc('generate_monthly_bill', {
            p_card_id: cardId,
            p_month: currentMonth,
            p_year: currentYear
          });

        if (generateError) {
          console.error('Erro ao gerar fatura:', generateError);
        } else {
          // Buscar novamente após gerar
          const { data: newBill } = await supabase
            .from('card_bills')
            .select('*')
            .eq('card_id', cardId)
            .eq('bill_month', currentMonth)
            .eq('bill_year', currentYear)
            .maybeSingle();
          
          bill = newBill;
        }
      }

      setBillData(bill);

      // Buscar parcelamentos que têm itens neste período
      const { data: installments } = await supabase
        .from('card_installments')
        .select('id, description, installments_count')
        .eq('card_id', cardId)
        .eq('user_id', user.id);

      if (installments && installments.length > 0) {
        const installmentIds = installments.map(inst => inst.id);
        
        // Buscar itens de parcelamento do período
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);

        const { data: items } = await supabase
          .from('card_installment_items')
          .select('*')
          .in('installment_id', installmentIds)
          .gte('due_date', startDate.toISOString().split('T')[0])
          .lte('due_date', endDate.toISOString().split('T')[0])
          .order('due_date', { ascending: true });

        if (items) {
          const itemsWithDescription = items.map(item => {
            const installment = installments.find(inst => inst.id === item.installment_id);
            return {
              ...item,
              description: installment?.description || 'Parcelamento',
              installments_count: installment?.installments_count || 0
            };
          });
          setInstallmentItems(itemsWithDescription);
        }
      }

      // Buscar transações do período (não parceladas e excluindo pagamentos de fatura)
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);

      const { data: txns } = await supabase
        .from('transactions')
        .select(`
          id,
          description,
          amount,
          date,
          category_id,
          categories (name)
        `)
        .eq('card_id', cardId)
        .eq('user_id', user.id)
        .is('parent_transaction_id', null)
        .eq('installments_count', 1)
        .neq('description', 'Pagamento de fatura - Cartão')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (txns) {
        const transactionsWithCategory = txns.map(txn => ({
          ...txn,
          category_name: (txn as any).categories?.name || 'Sem categoria'
        }));
        setTransactions(transactionsWithCategory);
      }

      // Buscar transações de pagamento da fatura
      const { data: paymentTxns } = await supabase
        .from('transactions')
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', user.id)
        .eq('description', 'Pagamento de fatura - Cartão')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (paymentTxns) {
        setPaymentTransactions(paymentTxns);
      }

    } catch (error) {
      console.error('Error fetching bill data:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados da fatura"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillData();
  }, [user?.id, cardId, currentMonth, currentYear]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="text-green-600">Paga</Badge>;
      case 'partial':
        return <Badge variant="secondary">Parcial</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencida</Badge>;
      default:
        return <Badge variant="outline">Em aberto</Badge>;
    }
  };

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="text-green-600">Pago</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const totalInstallments = installmentItems.reduce((sum, item) => 
    item.status === 'paid' ? sum : sum + item.amount, 0
  );
  
  const totalTransactions = transactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  
  const totalBillAmount = totalInstallments + totalTransactions;

  const handleOpenPaymentDialog = (type: 'full' | 'partial' | 'installment') => {
    setPaymentType(type);
    setPaymentDialogOpen(true);
  };

  const handleCancelPayment = async () => {
    if (!billData || !user?.id) return;

    try {
      // 1. Excluir transações de pagamento e restaurar contas
      for (const txn of paymentTransactions) {
        await supabase
          .from('transactions')
          .delete()
          .eq('id', txn.id);

        // 2. Restaurar saldo da conta se houver
        if (txn.account_id) {
          const { data: account } = await supabase
            .from('accounts')
            .select('balance')
            .eq('id', txn.account_id)
            .single();

          if (account) {
            await supabase
              .from('accounts')
              .update({
                balance: account.balance + Math.abs(txn.amount),
                updated_at: new Date().toISOString()
              })
              .eq('id', txn.account_id)
              .eq('user_id', user.id);
          }
        }
      }

      // 3. Restaurar limite do cartão
      const { data: card } = await supabase
        .from('cards')
        .select('used_amount')
        .eq('id', cardId)
        .single();

      if (card) {
        await supabase
          .from('cards')
          .update({
            used_amount: card.used_amount + billData.paid_amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', cardId)
          .eq('user_id', user.id);
      }

      // 4. Resetar fatura
      await supabase
        .from('card_bills')
        .update({
          paid_amount: 0,
          remaining_amount: billData.total_amount,
          status: billData.due_date < new Date().toISOString().split('T')[0] ? 'overdue' : 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', billData.id);

      toast({
        title: "Pagamento cancelado",
        description: "A fatura foi restaurada ao estado anterior."
      });

      setCancelDialogOpen(false);
      fetchBillData();
      if (onBillUpdate) onBillUpdate();
    } catch (error) {
      console.error('Error canceling payment:', error);
      toast({
        variant: "destructive",
        title: "Erro ao cancelar pagamento"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p>Carregando fatura...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card de Status do Pagamento */}
      {billData && billData.paid_amount > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {billData.status === 'paid' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {billData.status === 'partial' && (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <CardTitle className="text-lg">
                  {billData.status === 'paid' && 'Fatura Paga Completamente'}
                  {billData.status === 'partial' && 'Fatura Paga Parcialmente'}
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar Pagamento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor pago:</span>
                <span className="font-medium">{formatCurrency(billData.paid_amount)}</span>
              </div>
              {billData.status === 'partial' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor restante:</span>
                  <span className="font-medium">{formatCurrency(billData.remaining_amount)}</span>
                </div>
              )}
              {paymentTransactions.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forma de pagamento:</span>
                  <span className="font-medium">
                    {paymentTransactions.length > 1 ? 'Parcelado' : 'À vista'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header com navegação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center">
              <CardTitle className="text-2xl">
                {getMonthName(currentMonth)} {currentYear}
              </CardTitle>
              {billData && (
                <p className="text-sm text-muted-foreground mt-1">
                  Vencimento: {formatDate(billData.due_date)}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Botões de Ação */}
      {billData && totalBillAmount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => handleOpenPaymentDialog('full')}>
                Pagar Fatura Completa
              </Button>
              <Button variant="outline" onClick={() => handleOpenPaymentDialog('partial')}>
                Pagar Parcialmente
              </Button>
              <Button variant="outline" onClick={() => handleOpenPaymentDialog('installment')}>
                Parcelar Fatura
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo da Fatura */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBillAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Parcelamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInstallments)}
            </div>
            <p className="text-xs text-muted-foreground">
              {installmentItems.length} parcelas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTransactions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billData ? getStatusBadge(billData.status) : 'N/A'}
            </div>
            {billData && billData.paid_amount > 0 && (
              <p className="text-xs text-muted-foreground">
                Pago: {formatCurrency(billData.paid_amount)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de Parcelamentos */}
      {installmentItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Parcelamentos do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installmentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.installment_number}/{item.installments_count}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(item.due_date)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      {getItemStatusBadge(item.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Lista de Transações */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Compras do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      <p className="font-medium">{txn.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{txn.category_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(txn.date)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Math.abs(txn.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


      {/* Mensagem quando não há itens */}
      {installmentItems.length === 0 && transactions.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Fatura vazia</h3>
              <p className="text-muted-foreground">
                Não há lançamentos neste período
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Pagamento */}
      {billData && (
        <BillPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          billId={billData.id}
          cardId={cardId}
          totalAmount={totalBillAmount}
          remainingAmount={totalBillAmount}
          paymentType={paymentType}
          onPaymentSuccess={fetchBillData}
        />
      )}

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o pagamento desta fatura? 
              Todas as transações de pagamento serão excluídas e a fatura retornará ao estado anterior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelPayment}>
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
