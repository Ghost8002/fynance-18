import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Package, CreditCard, Check, Clock, XCircle } from "lucide-react";

interface CardInstallmentsProps {
  cardId: string;
  onInstallmentPaid?: () => void;
}

interface InstallmentData {
  id: string;
  description: string;
  total_amount: number;
  installments_count: number;
  created_at: string;
  next_due_date: string;
  paid_installments: number;
  remaining_amount: number;
}

interface InstallmentItem {
  id: string;
  installment_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_date?: string;
}

export const CardInstallments = ({ cardId, onInstallmentPaid }: CardInstallmentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: cards, update: updateCard, refetch: refetchCards } = useSupabaseData('cards', user?.id);
  const [installments, setInstallments] = useState<InstallmentData[]>([]);
  const [installmentItems, setInstallmentItems] = useState<InstallmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingInstallment, setCancelingInstallment] = useState<InstallmentData | null>(null);
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

  const fetchInstallments = async () => {
    if (!user?.id || !cardId) return;

    try {
      setLoading(true);
      
      // Buscar parcelamentos do cartão
      const { data: installmentsData, error: installmentsError } = await supabase
        .from('card_installments')
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (installmentsError) {
        console.error('Erro ao buscar parcelamentos:', installmentsError);
        toast({
          variant: "destructive",
          title: "Erro ao carregar parcelamentos"
        });
        return;
      }

      // Buscar itens dos parcelamentos
      if (installmentsData && installmentsData.length > 0) {
        const installmentIds = installmentsData.map(inst => inst.id);
        
        const { data: itemsData, error: itemsError } = await supabase
          .from('card_installment_items')
          .select('*')
          .in('installment_id', installmentIds)
          .order('installment_number', { ascending: true });

        if (itemsError) {
          console.error('Erro ao buscar itens dos parcelamentos:', itemsError);
        } else {
          setInstallmentItems(itemsData || []);
        }
      }

      // Processar dados para exibição
      const processedInstallments = (installmentsData || []).map(installment => {
        const items = installmentItems.filter(item => item.installment_id === installment.id);
        const paidItems = items.filter(item => item.status === 'paid');
        const nextDueItem = items.find(item => item.status === 'pending');
        
        return {
          id: installment.id,
          description: installment.description,
          total_amount: installment.total_amount,
          installments_count: installment.installments_count,
          created_at: installment.created_at,
          next_due_date: nextDueItem?.due_date || '',
          paid_installments: paidItems.length,
          remaining_amount: installment.total_amount - (paidItems.reduce((sum, item) => sum + item.amount, 0))
        };
      });

      setInstallments(processedInstallments);
      
    } catch (error) {
      console.error('Error fetching installments:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar parcelamentos"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, [user?.id, cardId]);

  // Recarregar quando installmentItems mudar para processar os dados corretamente
  useEffect(() => {
    if (installmentItems.length > 0) {
      fetchInstallments();
    }
  }, [installmentItems.length]);

  const handleCancelInstallment = async () => {
    if (!cancelingInstallment) return;

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

      // Calcular quanto foi realmente usado (parcelas já pagas)
      const items = installmentItems.filter(item => item.installment_id === cancelingInstallment.id);
      const paidItems = items.filter(item => item.status === 'paid');
      const paidAmount = paidItems.reduce((sum, item) => sum + item.amount, 0);
      
      // O valor a restaurar é o total menos o que já foi pago
      const amountToRestore = cancelingInstallment.total_amount - paidAmount;

      // Restaurar o limite do cartão
      const newUsedAmount = Math.max(0, Number(card.used_amount) - amountToRestore);
      await updateCard(cardId, { used_amount: newUsedAmount });

      // Deletar os itens do parcelamento
      const { error: itemsError } = await supabase
        .from('card_installment_items')
        .delete()
        .eq('installment_id', cancelingInstallment.id);

      if (itemsError) throw itemsError;

      // Deletar o parcelamento
      const { error: installmentError } = await supabase
        .from('card_installments')
        .delete()
        .eq('id', cancelingInstallment.id)
        .eq('user_id', user?.id);

      if (installmentError) throw installmentError;

      // Deletar dívidas relacionadas
      await supabase
        .from('debts')
        .delete()
        .eq('installment_id', cancelingInstallment.id)
        .eq('user_id', user?.id);

      await fetchInstallments();
      await refetchCards();
      
      if (onInstallmentPaid) {
        onInstallmentPaid();
      }

      toast({
        title: "Parcelamento cancelado",
        description: "O limite do cartão foi restaurado com sucesso",
      });

      setShowCancelDialog(false);
      setCancelingInstallment(null);
    } catch (error) {
      console.error('Erro ao cancelar parcelamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o parcelamento",
        variant: "destructive",
      });
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="text-green-600"><Check className="w-3 h-3 mr-1" />Paga</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Vencida</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const getItemStatus = (item: InstallmentItem) => {
    if (item.status === 'paid') return 'paid';
    
    const today = new Date();
    const dueDate = new Date(item.due_date);
    
    if (dueDate < today) return 'overdue';
    return 'pending';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p>Carregando parcelamentos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!installments || installments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum parcelamento encontrado</h3>
            <p className="text-muted-foreground">
              Suas compras parceladas aparecerão aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo dos Parcelamentos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total em Parcelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                installments.reduce((sum, inst) => sum + inst.total_amount, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Parcelamentos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {installments.filter(inst => inst.remaining_amount > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Parcelas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {installmentItems.filter(item => getItemStatus(item) === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Parcelamentos */}
      {installments.map((installment) => {
        const items = installmentItems.filter(item => item.installment_id === installment.id);
        const pendingItems = items.filter(item => getItemStatus(item) !== 'paid');
        
        return (
          <Card key={installment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{installment.description}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {installment.paid_installments}/{installment.installments_count} parcelas pagas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatCurrency(installment.total_amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total do parcelamento
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCancelingInstallment(installment);
                      setShowCancelDialog(true);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const status = getItemStatus(item);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.installment_number}/{installment.installments_count}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(item.due_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(status)}
                            {status === 'paid' && item.paid_date && (
                              <p className="text-xs text-muted-foreground ml-2">
                                Pago em {formatDate(item.paid_date)}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma parcela encontrada para este parcelamento
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Dialog de confirmação de cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar parcelamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá cancelar o parcelamento "{cancelingInstallment?.description}" no valor total de{" "}
              {cancelingInstallment && formatCurrency(cancelingInstallment.total_amount)}.
              {cancelingInstallment && cancelingInstallment.paid_installments > 0 && (
                <span className="block mt-2 text-amber-600">
                  Atenção: {cancelingInstallment.paid_installments} parcela(s) já foi(ram) paga(s).
                  Apenas o valor das parcelas pendentes será restaurado ao limite do cartão.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelingInstallment(null)}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInstallment}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancelar Parcelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};