import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  installments_count: number;
  installment_number: number;
  parent_transaction_id: string | null;
  category_id: string;
}

interface CardInstallmentsProps {
  cardId: string;
  onInstallmentPaid?: () => void;
}

export const CardInstallments = ({ cardId, onInstallmentPaid }: CardInstallmentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [installments, setInstallments] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const fetchInstallments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id);

      const categoryMap = categoriesData?.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {} as Record<string, string>) || {};

      setCategories(categoryMap);

      // Fetch installment transactions for this card
      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .eq('type', 'expense')
        .gt('installments_count', 1)
        .gte('date', new Date().toISOString().split('T')[0]) // Only future installments
        .order('date', { ascending: true });

      if (error) throw error;

      setInstallments(transactionsData || []);
    } catch (error) {
      console.error('Error fetching installments:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os parcelamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, [cardId, user?.id]);

  const handleMarkAsPaid = async (transactionId: string, amount: number) => {
    try {
      // Move the transaction date to today (marking as paid)
      const { error } = await supabase
        .from('transactions')
        .update({ date: new Date().toISOString().split('T')[0] })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Parcela marcada como paga!",
      });

      // Refresh installments list
      await fetchInstallments();
      onInstallmentPaid?.();

    } catch (error) {
      console.error('Error marking installment as paid:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a parcela como paga",
        variant: "destructive",
      });
    }
  };

  const getInstallmentStatus = (date: string) => {
    const installmentDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((installmentDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return { label: "Vencida", variant: "destructive" as const, icon: Clock };
    if (diffDays <= 7) return { label: "Vence em breve", variant: "secondary" as const, icon: Calendar };
    return { label: "Em dia", variant: "default" as const, icon: CheckCircle };
  };

  // Group installments by parent transaction
  const groupedInstallments = installments.reduce((acc, installment) => {
    const parentId = installment.parent_transaction_id || installment.id;
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(installment);
    return acc;
  }, {} as Record<string, Transaction[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Parcelamentos Futuros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Carregando parcelamentos...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (Object.keys(groupedInstallments).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Parcelamentos Futuros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum parcelamento futuro encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar size={20} />
          Parcelamentos Futuros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedInstallments).map(([parentId, installmentGroup]) => {
            const firstInstallment = installmentGroup[0];
            const baseDescription = firstInstallment.description.replace(/ \(\d+\/\d+\)$/, '');
            
            return (
              <div key={parentId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{baseDescription}</h4>
                  <Badge variant="outline">
                    {firstInstallment.installments_count}x de {formatCurrency(firstInstallment.amount)}
                  </Badge>
                </div>
                
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installmentGroup.map((installment) => {
                        const status = getInstallmentStatus(installment.date);
                        const StatusIcon = status.icon;
                        
                        return (
                          <TableRow key={installment.id}>
                            <TableCell>
                              {installment.installment_number}/{installment.installments_count}
                            </TableCell>
                            <TableCell>{formatDate(installment.date)}</TableCell>
                            <TableCell>{formatCurrency(installment.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                                <StatusIcon size={12} />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPaid(installment.id, installment.amount)}
                                className="text-xs"
                              >
                                Marcar como Paga
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};