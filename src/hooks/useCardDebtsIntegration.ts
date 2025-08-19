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
  // Função para sincronizar parcelamentos existentes
  syncExistingInstallments: () => Promise<void>;
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
      console.log('Buscando faturas de cartão para usuário:', user.id);
      
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

      console.log('Faturas encontradas:', data);
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
      console.log('Buscando parcelamentos de cartão para usuário:', user.id);
      
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

      console.log('Parcelamentos encontrados:', data);
      setCardInstallments(data || []);
    } catch (error) {
      console.error('Erro ao buscar parcelamentos:', error);
    } finally {
      setLoadingInstallments(false);
    }
  };

  // Criar dívida a partir de fatura de cartão
  const createDebtFromCardBill = async (
    cardId: string, 
    billMonth: number, 
    billYear: number
  ): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase.rpc('create_debt_from_card_bill', {
        p_card_id: cardId,
        p_bill_month: billMonth,
        p_bill_year: billYear
      });

      if (error) {
        console.error('Erro ao criar dívida da fatura:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar dívida da fatura",
          variant: "destructive",
        });
        return null;
      }

      if (data) {
        toast({
          title: "Dívida criada",
          description: "Dívida da fatura criada com sucesso",
        });
        return data;
      }

      // Se não retornou ID, pode ser que a dívida já exista
      toast({
        title: "Dívida já existe",
        description: "Esta fatura já possui uma dívida associada",
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

  // Criar dívidas a partir de parcelamentos (via RPC)
  const createDebtsFromInstallments = async (installmentId: string): Promise<string[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase.rpc('create_debts_from_installments', {
        p_installment_id: installmentId,
      });

      if (error) {
        console.error('Erro ao criar dívidas dos parcelamentos (RPC):', error);
        toast({
          title: "Erro",
          description: "Erro ao criar dívidas dos parcelamentos",
          variant: "destructive",
        });
        return [];
      }

      const createdIds = (data as string[]) || [];

      if (createdIds.length > 0) {
        toast({
          title: "Dívidas Criadas",
          description: `${createdIds.length} dívidas de parcelamento foram criadas com sucesso`,
        });
      } else {
        toast({
          title: "Sem novas dívidas",
          description: "Nenhuma nova dívida precisava ser criada",
        });
      }

      return createdIds;
    } catch (error) {
      console.error('Erro ao criar dívidas dos parcelamentos (RPC):', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar dívidas",
        variant: "destructive",
      });
      return [];
    }
  };

  // Sincronizar pagamento de dívida (via RPC)
  const syncDebtPayment = async (
    debtId: string, 
    paymentAmount: number, 
    paymentDate?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('sync_debt_payment', {
        p_debt_id: debtId,
        p_payment_amount: paymentAmount,
        p_payment_date: paymentDate || new Date().toISOString().split('T')[0],
      });

      if (error) {
        console.error('Erro ao sincronizar pagamento (RPC):', error);
        toast({
          title: "Erro",
          description: "Erro ao sincronizar pagamento",
          variant: "destructive",
        });
        return false;
      }

      if (data === true) {
        toast({
          title: "Pagamento Sincronizado",
          description: "Pagamento foi sincronizado com o cartão com sucesso",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao sincronizar pagamento (RPC):', error);
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
      console.log('Iniciando sincronização completa de dívidas de cartão...');
      
      const { data, error } = await supabase.rpc('sync_card_debts');

      if (error) {
        console.error('Erro ao sincronizar dívidas:', error);
        toast({
          title: "Erro",
          description: "Erro ao sincronizar dívidas de cartão",
          variant: "destructive",
        });
        return;
      }

      console.log('Resposta da sincronização:', data);

      const result = data as { 
        success?: boolean; 
        debts_created?: number;
        bills_synced?: number;
        installments_synced?: number;
      };
      
      if (result?.success) {
        const totalDebts = result?.debts_created || 0;
        const billsSynced = result?.bills_synced || 0;
        const installmentsSynced = result?.installments_synced || 0;
        
        console.log('Sincronização bem-sucedida:', {
          totalDebts,
          billsSynced,
          installmentsSynced
        });
        
        let description = `${totalDebts} dívidas de cartão foram criadas`;
        
        if (billsSynced > 0 || installmentsSynced > 0) {
          description = `${billsSynced} faturas e ${installmentsSynced} parcelamentos sincronizados`;
        }
        
        toast({
          title: "Sincronização Concluída",
          description: description,
        });
      } else {
        console.log('Nenhuma nova dívida foi criada');
        toast({
          title: "Sincronização",
          description: "Nenhuma nova dívida foi criada",
        });
      }

      // Recarregar dados após sincronização
      console.log('Recarregando dados após sincronização...');
      await fetchCardBills(cardId);
      await fetchCardInstallments(cardId);

    } catch (error) {
      console.error('Erro ao sincronizar dívidas:', error);
      toast({
        title: "Erro",
        description: "Erro ao sincronizar dívidas de cartão",
        variant: "destructive",
      });
    }
  };

  // Sincronizar parcelamentos existentes (via RPC por parcelamento)
  const syncExistingInstallments = async () => {
    if (!user?.id) return;

    try {
      console.log('Sincronizando parcelamentos existentes (RPC)...');
      
      const { data: installments, error: installmentsError } = await supabase
        .from('card_installments')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (installmentsError) {
        console.error('Erro ao buscar parcelamentos:', installmentsError);
        toast({
          title: "Erro",
          description: "Erro ao buscar parcelamentos",
          variant: "destructive",
        });
        return;
      }

      let totalDebtsCreated = 0;

      for (const inst of installments || []) {
        const ids = await createDebtsFromInstallments(inst.id);
        totalDebtsCreated += ids.length;
      }

      console.log('Parcelamentos sincronizados:', totalDebtsCreated);
      
      toast({
        title: "Parcelamentos Sincronizados",
        description: `${totalDebtsCreated} dívidas de parcelamentos foram criadas`,
      });

      await fetchCardInstallments();

    } catch (error) {
      console.error('Erro ao sincronizar parcelamentos existentes (RPC):', error);
      toast({
        title: "Erro",
        description: "Erro ao sincronizar parcelamentos existentes",
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
    syncExistingInstallments,
  };
};
