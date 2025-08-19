import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CardBill {
  id: string;
  card_id: string;
  bill_month: number;
  bill_year: number;
  due_date: string;
  total_amount: number;
  remaining_amount: number;
  status: string;
}

interface CardInstallment {
  id: string;
  card_id: string;
  description: string;
  total_amount: number;
  installments_count: number;
  first_installment_date?: string;
  status?: string;
}

interface CardDebtsIntegration {
  // Dados das faturas de cartão
  cardBills: CardBill[];
  // Dados dos parcelamentos
  cardInstallments: CardInstallment[];
  // Estados de carregamento
  loadingBills: boolean;
  loadingInstallments: boolean;
  // Funções para criar dívidas (placeholder - funções não implementadas no banco)
  createDebtFromCardBill: (cardId: string, billMonth: number, billYear: number) => Promise<string | null>;
  createDebtsFromInstallments: (installmentId: string) => Promise<string[]>;
  // Funções para sincronizar pagamentos (placeholder - funções não implementadas no banco)
  syncDebtPayment: (debtId: string, paymentAmount: number, paymentDate?: string) => Promise<boolean>;
  // Funções para buscar dados
  fetchCardBills: (cardId?: string) => Promise<void>;
  fetchCardInstallments: (cardId?: string) => Promise<void>;
  // Função para sincronizar automaticamente
  syncAllCardDebts: (cardId?: string) => Promise<void>;
}

export const useCardDebtsIntegration = (): CardDebtsIntegration => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cardBills, setCardBills] = useState<CardBill[]>([]);
  const [cardInstallments, setCardInstallments] = useState<CardInstallment[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  // Buscar faturas de cartão
  const fetchCardBills = async (cardId?: string) => {
    if (!user?.id) return;

    try {
      setLoadingBills(true);
      
      let query = supabase
        .from('card_bills')
        .select('*')
        .eq('user_id', user.id)
        .order('bill_year', { ascending: false })
        .order('bill_month', { ascending: false });

      if (cardId) {
        query = query.eq('card_id', cardId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar faturas:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar faturas de cartão",
          variant: "destructive",
        });
        return;
      }

      setCardBills(data || []);
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
    } finally {
      setLoadingBills(false);
    }
  };

  // Buscar parcelamentos de cartão
  const fetchCardInstallments = async (cardId?: string) => {
    if (!user?.id) return;

    try {
      setLoadingInstallments(true);
      
      let query = supabase
        .from('card_installments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cardId) {
        query = query.eq('card_id', cardId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar parcelamentos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar parcelamentos",
          variant: "destructive",
        });
        return;
      }

      setCardInstallments(data || []);
    } catch (error) {
      console.error('Erro ao buscar parcelamentos:', error);
    } finally {
      setLoadingInstallments(false);
    }
  };

  // Criar dívida a partir de fatura de cartão (função placeholder)
  const createDebtFromCardBill = async (
    cardId: string, 
    billMonth: number, 
    billYear: number
  ): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      // Esta funcionalidade ainda está em desenvolvimento
      // Por enquanto, apenas retorna um placeholder
      toast({
        title: "Em Desenvolvimento",
        description: "Funcionalidade de integração cartão/dívidas em breve",
      });

      return null;
    } catch (error) {
      console.error('Erro ao criar dívida da fatura:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar dívida",
        variant: "destructive",
      });
      return null;
    }
  };

  // Criar dívidas a partir de parcelamentos (função placeholder)
  const createDebtsFromInstallments = async (installmentId: string): Promise<string[]> => {
    if (!user?.id) return [];

    try {
      // Esta funcionalidade ainda está em desenvolvimento
      toast({
        title: "Em Desenvolvimento",
        description: "Funcionalidade de integração parcelamentos/dívidas em breve",
      });

      return [];
    } catch (error) {
      console.error('Erro ao criar dívidas dos parcelamentos:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar dívidas",
        variant: "destructive",
      });
      return [];
    }
  };

  // Sincronizar pagamento de dívida (função placeholder)
  const syncDebtPayment = async (
    debtId: string, 
    paymentAmount: number, 
    paymentDate?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Esta funcionalidade ainda está em desenvolvimento
      toast({
        title: "Em Desenvolvimento",
        description: "Sincronização de pagamentos em breve",
      });

      return false;
    } catch (error) {
      console.error('Erro ao sincronizar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao sincronizar pagamento",
        variant: "destructive",
      });
      return false;
    }
  };

  // Sincronizar todas as dívidas de cartão
  const syncAllCardDebts = async (cardId?: string) => {
    if (!user?.id) return;

    try {
      // Buscar faturas não pagas
      let billsQuery = supabase
        .from('card_bills')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'paid');

      if (cardId) {
        billsQuery = billsQuery.eq('card_id', cardId);
      }

      const { data: bills } = await billsQuery;

      // Criar dívidas para faturas não pagas
      for (const bill of bills || []) {
        await createDebtFromCardBill(bill.card_id, bill.bill_month, bill.bill_year);
      }

      // Buscar parcelamentos ativos
      let installmentsQuery = supabase
        .from('card_installments')
        .select('*')
        .eq('user_id', user.id);

      if (cardId) {
        installmentsQuery = installmentsQuery.eq('card_id', cardId);
      }

      const { data: installments } = await installmentsQuery;

      // Criar dívidas para parcelamentos ativos
      for (const installment of installments || []) {
        await createDebtsFromInstallments(installment.id);
      }

      toast({
        title: "Sincronização Concluída",
        description: "Todas as dívidas de cartão foram sincronizadas",
      });

    } catch (error) {
      console.error('Erro ao sincronizar dívidas:', error);
      toast({
        title: "Erro",
        description: "Erro ao sincronizar dívidas de cartão",
        variant: "destructive",
      });
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      fetchCardBills();
      fetchCardInstallments();
    }
  }, [user?.id]);

  return {
    cardBills,
    cardInstallments,
    loadingBills,
    loadingInstallments,
    createDebtFromCardBill,
    createDebtsFromInstallments,
    syncDebtPayment,
    fetchCardBills,
    fetchCardInstallments,
    syncAllCardDebts,
  };
};
