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

  // Criar dívidas a partir de parcelamentos
  const createDebtsFromInstallments = async (installmentId: string): Promise<string[]> => {
    if (!user?.id) return [];

    try {
      // Buscar os itens do parcelamento para criar dívidas manualmente
      const { data: installment, error: installmentError } = await supabase
        .from('card_installments')
        .select('*')
        .eq('id', installmentId)
        .single();

      if (installmentError) {
        console.error('Erro ao buscar parcelamento:', installmentError);
        toast({
          title: "Erro",
          description: "Erro ao buscar parcelamento",
          variant: "destructive",
        });
        return [];
      }

      const { data: items, error: itemsError } = await supabase
        .from('card_installment_items')
        .select('*')
        .eq('installment_id', installmentId)
        .order('installment_number');

      if (itemsError) {
        console.error('Erro ao buscar itens do parcelamento:', itemsError);
        toast({
          title: "Erro",
          description: "Erro ao buscar itens do parcelamento",
          variant: "destructive",
        });
        return [];
      }

      const createdDebtIds: string[] = [];

      // Criar dívidas para cada item
      for (const item of items || []) {
        // Verificar se já existe uma dívida para esta parcela
        const { data: existingDebt } = await supabase
          .from('debts')
          .select('id')
          .eq('installment_id', installmentId)
          .eq('installment_number', item.installment_number)
          .single();

        if (!existingDebt) {
          // Criar nova dívida para a parcela
          const { data: debt, error: debtError } = await supabase
            .from('debts')
            .insert({
              user_id: installment.user_id,
              description: `${installment.description} - ${item.installment_number}/${installment.installments_count}`,
              amount: item.amount,
              due_date: item.due_date,
              status: item.status === 'paid' ? 'paid' : (new Date(item.due_date) < new Date() ? 'overdue' : 'pending'),
              card_id: installment.card_id,
              installment_id: installmentId,
              installment_number: item.installment_number,
              category_id: installment.category_id,
              notes: 'Dívida gerada automaticamente do parcelamento'
            })
            .select('id')
            .single();

          if (!debtError && debt) {
            createdDebtIds.push(debt.id);
          }
        }
      }

      if (createdDebtIds.length > 0) {
        toast({
          title: "Dívidas Criadas",
          description: `${createdDebtIds.length} dívidas de parcelamento foram criadas com sucesso`,
        });
      }

      return createdDebtIds;
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

  // Sincronizar pagamento de dívida
  const syncDebtPayment = async (
    debtId: string, 
    paymentAmount: number, 
    paymentDate?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Buscar a dívida para verificar se está relacionada a um parcelamento
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .select('*')
        .eq('id', debtId)
        .single();

      if (debtError || !debt) {
        console.error('Erro ao buscar dívida:', debtError);
        toast({
          title: "Erro",
          description: "Dívida não encontrada",
          variant: "destructive",
        });
        return false;
      }

      // Se a dívida está relacionada a um parcelamento, sincronizar o item também
      if (debt.installment_id && debt.installment_number) {
        const { error: itemError } = await supabase
          .from('card_installment_items')
          .update({
            status: 'paid',
            paid_date: paymentDate || new Date().toISOString().split('T')[0]
          })
          .eq('installment_id', debt.installment_id)
          .eq('installment_number', debt.installment_number);

        if (itemError) {
          console.error('Erro ao atualizar item do parcelamento:', itemError);
        }
      }

      toast({
        title: "Pagamento Sincronizado",
        description: "Pagamento foi sincronizado com o cartão com sucesso",
      });
      return true;
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

  // Sincronizar parcelamentos existentes (para resolver problemas de sincronização)
  const syncExistingInstallments = async () => {
    if (!user?.id) return;

    try {
      console.log('Sincronizando parcelamentos existentes...');
      
      // Buscar parcelamentos ativos
      const { data: installments, error: installmentsError } = await supabase
        .from('card_installments')
        .select('*')
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

      // Para cada parcelamento, verificar se já existem dívidas
      for (const installment of installments || []) {
        const { data: existingDebts, error: debtsError } = await supabase
          .from('debts')
          .select('id')
          .eq('installment_id', installment.id);

        if (debtsError) {
          console.error('Error checking existing debts:', debtsError);
          continue;
        }

        // Se não existem dívidas, buscar itens para criar dívidas manualmente
        if (!existingDebts || existingDebts.length === 0) {
          const { data: items, error: itemsError } = await supabase
            .from('card_installment_items')
            .select('*')
            .eq('installment_id', installment.id)
            .order('installment_number');

          if (itemsError) {
            console.error('Error fetching installment items:', itemsError);
            continue;
          }

          // Criar dívidas para cada item
          for (const item of items || []) {
            const { error: insertError } = await supabase
              .from('debts')
              .insert({
                user_id: installment.user_id,
                description: `${installment.description} - ${item.installment_number}/${installment.installments_count}`,
                amount: item.amount,
                due_date: item.due_date,
                status: item.status === 'paid' ? 'paid' : (new Date(item.due_date) < new Date() ? 'overdue' : 'pending'),
                card_id: installment.card_id,
                installment_id: installment.id,
                installment_number: item.installment_number,
                category_id: installment.category_id,
                notes: 'Dívida gerada automaticamente do parcelamento'
              });

            if (!insertError) {
              totalDebtsCreated++;
            }
          }
        }
      }

      console.log('Parcelamentos sincronizados:', totalDebtsCreated);
      
      toast({
        title: "Parcelamentos Sincronizados",
        description: `${totalDebtsCreated} dívidas de parcelamentos foram criadas`,
      });

      // Recarregar dados após sincronização
      await fetchCardInstallments();

    } catch (error) {
      console.error('Erro ao sincronizar parcelamentos existentes:', error);
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
