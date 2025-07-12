import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, 
  Plus, 
  Receipt, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  Calendar
} from "lucide-react";

interface CardData {
  id: string;
  name: string;
  credit_limit: number;
  used_amount: number;
  last_four_digits: string;
  color: string;
  closing_day: number;
  due_day: number;
}

interface CardBill {
  id: string;
  card_id: string;
  bill_month: number;
  bill_year: number;
  due_date: string;
  closing_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  created_at: string;
}

interface CardBillManagementProps {
  card: CardData;
  onUpdate?: () => void;
}

export const CardBillManagement = ({ card, onUpdate }: CardBillManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const [bills, setBills] = useState<CardBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState<{open: boolean, bill: CardBill | null}>({
    open: false,
    bill: null
  });
  const [generateDialog, setGenerateDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    accountId: "",
    description: ""
  });
  const [generateForm, setGenerateForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const fetchBills = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('card_bills')
        .select('*')
        .eq('card_id', card.id)
        .order('bill_year', { ascending: false })
        .order('bill_month', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as faturas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [user?.id, card.id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600"><CheckCircle size={12} className="mr-1" />Paga</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle size={12} className="mr-1" />Vencida</Badge>;
      case 'partial':
        return <Badge variant="secondary"><Clock size={12} className="mr-1" />Parcial</Badge>;
      default:
        return <Badge variant="outline"><Receipt size={12} className="mr-1" />Aberta</Badge>;
    }
  };

  const handleGenerateBill = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('generate_monthly_bill', {
        p_card_id: card.id,
        p_month: generateForm.month,
        p_year: generateForm.year
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fatura gerada com sucesso!",
      });

      setGenerateDialog(false);
      fetchBills();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error generating bill:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar a fatura",
        variant: "destructive",
      });
    }
  };

  const handlePayBill = async () => {
    if (!paymentDialog.bill || !paymentForm.amount) return;

    const amount = parseFloat(paymentForm.amount);
    if (amount <= 0 || amount > paymentDialog.bill.remaining_amount) {
      toast({
        title: "Erro",
        description: "Valor inválido para pagamento",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('process_bill_payment', {
        p_bill_id: paymentDialog.bill.id,
        p_amount: amount,
        p_account_id: paymentForm.accountId || null,
        p_description: paymentForm.description || 'Pagamento de fatura'
      });

      if (error) throw error;

      // Criar transação
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        description: `Pagamento fatura ${card.name} - ${paymentDialog.bill.bill_month}/${paymentDialog.bill.bill_year}`,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        account_id: paymentForm.accountId || null,
        notes: paymentForm.description
      });

      toast({
        title: "Sucesso",
        description: "Pagamento processado com sucesso!",
      });

      setPaymentDialog({open: false, bill: null});
      setPaymentForm({amount: "", accountId: "", description: ""});
      fetchBills();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar o pagamento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt size={20} />
              Gestão de Faturas - {card.name}
            </CardTitle>
            <Dialog open={generateDialog} onOpenChange={setGenerateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} />
                  Gerar Fatura
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerar Nova Fatura</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="month">Mês</Label>
                      <Select 
                        value={generateForm.month.toString()} 
                        onValueChange={(value) => setGenerateForm({...generateForm, month: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 12}, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="year">Ano</Label>
                      <Input
                        id="year"
                        type="number"
                        value={generateForm.year}
                        onChange={(e) => setGenerateForm({...generateForm, year: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setGenerateDialog(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleGenerateBill} className="flex-1">
                      Gerar Fatura
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Faturas */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Carregando faturas...
              </div>
            </CardContent>
          </Card>
        ) : bills.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma fatura encontrada</p>
                <p className="text-sm mt-2">Gere uma nova fatura para começar</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          bills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span className="font-medium">
                          {new Date(0, bill.bill_month - 1).toLocaleDateString('pt-BR', { month: 'long' })} {bill.bill_year}
                        </span>
                      </div>
                      {getStatusBadge(bill.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-semibold text-lg">{formatCurrency(bill.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Restante</p>
                        <p className="font-semibold text-lg text-red-600">{formatCurrency(bill.remaining_amount)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Fechamento</p>
                        <p>{formatDate(bill.closing_date)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vencimento</p>
                        <p>{formatDate(bill.due_date)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {bill.status !== 'paid' && (
                      <Dialog 
                        open={paymentDialog.open && paymentDialog.bill?.id === bill.id} 
                        onOpenChange={(open) => setPaymentDialog({open, bill: open ? bill : null})}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <DollarSign size={16} />
                            Pagar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Pagar Fatura</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <p className="text-sm text-muted-foreground mb-2">Valor devido</p>
                              <p className="font-semibold text-lg">{formatCurrency(bill.remaining_amount)}</p>
                            </div>
                            
                            <div>
                              <Label htmlFor="amount">Valor do Pagamento *</Label>
                              <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                max={bill.remaining_amount}
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                                placeholder="0,00"
                              />
                            </div>

                            <div>
                              <Label htmlFor="accountId">Conta para Débito (Opcional)</Label>
                              <Select 
                                value={paymentForm.accountId} 
                                onValueChange={(value) => setPaymentForm({...paymentForm, accountId: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma conta" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Não debitar de nenhuma conta</SelectItem>
                                  {accounts?.map(account => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.name} - {formatCurrency(parseFloat(account.balance || '0'))}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="description">Descrição</Label>
                              <Input
                                id="description"
                                value={paymentForm.description}
                                onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                                placeholder="Descrição do pagamento"
                              />
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => setPaymentDialog({open: false, bill: null})} 
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                              <Button onClick={handlePayBill} className="flex-1">
                                Pagar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};