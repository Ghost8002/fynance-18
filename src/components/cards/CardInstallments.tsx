import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Package, CreditCard, Check, Clock } from "lucide-react";

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
  const [installments, setInstallments] = useState<InstallmentData[]>([]);
  const [installmentItems, setInstallmentItems] = useState<InstallmentItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      // Por enquanto, vamos simular dados vazios até as novas tabelas serem reconhecidas
      setInstallments([]);
      setInstallmentItems([]);
      
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

  const handlePayInstallment = async (itemId: string) => {
    try {
      const { error } = await supabase.rpc('process_installment_payment', {
        p_installment_item_id: itemId,
        p_amount: 0, // O valor será calculado automaticamente
        p_account_id: null
      });

      if (error) throw error;

      toast({
        title: "Parcela paga com sucesso!"
      });

      await fetchInstallments();
      onInstallmentPaid?.();

    } catch (error) {
      console.error('Error paying installment:', error);
      toast({
        variant: "destructive",
        title: "Erro ao pagar parcela"
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
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {formatCurrency(installment.total_amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total do parcelamento
                  </div>
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
                      <TableHead>Ações</TableHead>
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
                          </TableCell>
                          <TableCell>
                            {status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handlePayInstallment(item.id)}
                              >
                                Pagar
                              </Button>
                            )}
                            {status === 'paid' && item.paid_date && (
                              <p className="text-xs text-muted-foreground">
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
    </div>
  );
};