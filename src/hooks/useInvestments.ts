import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Investment, InvestmentTransaction, InvestmentFormData, InvestmentTransactionFormData } from '@/types/investments';
import { devLog, devError } from '@/utils/logger';

export function useInvestments() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestments = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setInvestments((data as Investment[]) || []);
      setError(null);
    } catch (err) {
      devError('Error fetching investments:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar investimentos');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchTransactions = useCallback(async (investmentId?: string) => {
    if (!user?.id) return;
    
    try {
      let query = supabase
        .from('investment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (investmentId) {
        query = query.eq('investment_id', investmentId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTransactions((data as InvestmentTransaction[]) || []);
    } catch (err) {
      devError('Error fetching investment transactions:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchInvestments();
    fetchTransactions();
  }, [fetchInvestments, fetchTransactions]);

  // Setup realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`investments-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investments', filter: `user_id=eq.${user.id}` },
        (payload) => {
          devLog('Investment realtime:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            setInvestments(prev => [payload.new as Investment, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setInvestments(prev => prev.map(inv => 
              inv.id === (payload.new as Investment).id ? payload.new as Investment : inv
            ));
          } else if (payload.eventType === 'DELETE') {
            setInvestments(prev => prev.filter(inv => inv.id !== (payload.old as any).id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investment_transactions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          devLog('Investment transaction realtime:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => [payload.new as InvestmentTransaction, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(tx => tx.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const createInvestment = async (data: InvestmentFormData) => {
    if (!user?.id) return { error: 'Usuário não autenticado' };
    
    try {
      const { data: result, error: insertError } = await supabase
        .from('investments')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (insertError) throw insertError;
      return { data: result, error: null };
    } catch (err) {
      devError('Error creating investment:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao criar investimento' };
    }
  };

  const updateInvestment = async (id: string, data: Partial<InvestmentFormData>) => {
    try {
      const { data: result, error: updateError } = await supabase
        .from('investments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data: result, error: null };
    } catch (err) {
      devError('Error updating investment:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao atualizar investimento' };
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      devError('Error deleting investment:', err);
      return { error: err instanceof Error ? err.message : 'Erro ao excluir investimento' };
    }
  };

  const createTransaction = async (data: InvestmentTransactionFormData) => {
    if (!user?.id) return { error: 'Usuário não autenticado' };
    
    try {
      const { data: result, error: insertError } = await supabase
        .from('investment_transactions')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Update investment quantity and average price based on transaction type
      const investment = investments.find(inv => inv.id === data.investment_id);
      if (investment && (data.type === 'aporte' || data.type === 'resgate')) {
        const newQuantity = data.type === 'aporte' 
          ? investment.quantity + data.quantity 
          : investment.quantity - data.quantity;
        
        let newAveragePrice = investment.average_price;
        if (data.type === 'aporte' && newQuantity > 0) {
          const totalCost = (investment.quantity * investment.average_price) + (data.quantity * data.price);
          newAveragePrice = totalCost / newQuantity;
        }
        
        await updateInvestment(data.investment_id, {
          quantity: Math.max(0, newQuantity),
          average_price: newAveragePrice
        });
      }
      
      return { data: result, error: null };
    } catch (err) {
      devError('Error creating investment transaction:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Erro ao criar transação' };
    }
  };

  // Computed values
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.average_price), 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.current_price), 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const investmentsByType = investments.reduce((acc, inv) => {
    const value = inv.quantity * inv.current_price;
    acc[inv.type] = (acc[inv.type] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  return {
    investments,
    transactions,
    loading,
    error,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    createTransaction,
    refetch: fetchInvestments,
    refetchTransactions: fetchTransactions,
    // Computed
    totalInvested,
    totalCurrentValue,
    totalProfit,
    totalProfitPercent,
    investmentsByType
  };
}
