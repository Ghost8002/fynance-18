import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { InstallmentPaymentModal } from "./InstallmentPaymentModal";
import { CheckCircle, Clock, Calendar, DollarSign, CreditCard } from "lucide-react";

interface InstallmentItem {
  id: string;
  installment_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_date: string | null;
  account_id: string | null;
  transaction_id: string | null;
}

interface Installment {
  id: string;
  description: string;
  total_amount: number;
  installments_count: number;
  first_installment_date: string;
  notes: string | null;
  tags: any;
  status: 'active' | 'completed' | 'cancelled';
  category_id: string;
}

interface CardInstallmentsProps {
  cardId: string;
  onInstallmentPaid?: () => void;
}

export const CardInstallments = ({ cardId, onInstallmentPaid }: CardInstallmentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [installmentItems, setInstallmentItems] = useState<InstallmentItem[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedInstallmentItem, setSelectedInstallmentItem] = useState<InstallmentItem | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const { data: categoriesData } = useSupabaseData('categories', user?.id);
  const { data: accountsData } = useSupabaseData('accounts', user?.id);

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
      const categoryMap = categoriesData?.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {} as Record<string, string>) || {};
      setCategories(categoryMap);

      // Fetch accounts
      const accountMap = accountsData?.reduce((acc, acc_item) => {
        acc[acc_item.id] = acc_item.name;
        return acc;
      }, {} as Record<string, string>) || {};
      setAccounts(accountMap);

      // Fetch installments for this card
      const { data: installmentsData, error: installmentsError } = await supabase
        .from('card_installments' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .order('created_at', { ascending: false });

      if (installmentsError) throw installmentsError;

      setInstallments((installmentsData as any as Installment[]) || []);

      // Fetch installment items for all installments
      if (installmentsData && installmentsData.length > 0) {
        const installmentIds = (installmentsData as any).map((inst: any) => inst.id);
        
        const { data: itemsData, error: itemsError } = await supabase
          .from('card_installment_items' as any)
          .select('*')
          .in('installment_id', installmentIds)
          .order('due_date', { ascending: true });

        if (itemsError) throw itemsError;

        setInstallmentItems((itemsData as any as InstallmentItem[]) || []);
      }

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
  }, [cardId, user?.id, categoriesData, accountsData]);

  const handleMarkAsPaid = (installmentItem: InstallmentItem) => {
    setSelectedInstallmentItem(installmentItem);
    setPaymentModalOpen(true);
  };

  const handlePaymentCompleted = () => {
    fetchInstallments();
    onInstallmentPaid?.();
  };

  const getInstallmentStatus = (item: InstallmentItem) => {
    if (item.status === 'paid') {
      return { label: "Paga", variant: "default" as const, icon: CheckCircle };
    }
    
    const dueDate = new Date(item.due_date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return { label: "Vencida", variant: "destructive" as const, icon: Clock };
    if (diffDays <= 7) return { label: "Vence em breve", variant: "secondary" as const, icon: Calendar };
    return { label: "Em dia", variant: "outline" as const, icon: Calendar };
  };

  // Group installment items by installment
  const groupedInstallments = installments.map(installment => {
    const items = installmentItems.filter(item => item.installment_id === installment.id);
    return {
      ...installment,
      items: items.sort((a, b) => a.installment_number - b.installment_number)
    };
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Parcelamentos
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

  if (groupedInstallments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Parcelamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum parcelamento encontrado para este cartão.</p>
            <p className="text-sm">Crie uma compra parcelada para começar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Parcelamentos ({groupedInstallments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {groupedInstallments.map((installment) => (
              <div key={installment.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{installment.description}</h4>
                    {installment.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {installment.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {installment.installments_count}x de {formatCurrency(installment.total_amount / installment.installments_count)}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total: {formatCurrency(installment.total_amount)}
                    </p>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installment.items.map((item) => {
                      const status = getInstallmentStatus(item);
                      const StatusIcon = status.icon;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.installment_number}/{installment.installments_count}
                          </TableCell>
                          <TableCell>{formatDate(item.due_date)}</TableCell>
                          <TableCell className="font-medium text-red-600">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                              <StatusIcon size={12} />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.status === 'paid' ? (
                              <div className="text-sm">
                                <p className="font-medium text-green-600">Paga</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.paid_date && formatDate(item.paid_date)}
                                </p>
                                {item.account_id && (
                                  <p className="text-xs text-muted-foreground">
                                    {accounts[item.account_id]}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Pendente</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.status === 'pending' ? (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsPaid(item)}
                                className="gap-1"
                              >
                                <DollarSign size={14} />
                                Pagar
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Paga
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <InstallmentPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        installmentItem={selectedInstallmentItem}
        onPaymentCompleted={handlePaymentCompleted}
      />
    </>
  );
};