import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { devError } from '@/utils/logger';

export interface CustomBank {
  id: string;
  user_id: string;
  name: string;
  short_name: string;
  website?: string;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomBankWithLogo extends CustomBank {
  logo_url?: string;
}

export const useCustomBanks = () => {
  const [customBanks, setCustomBanks] = useState<CustomBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  const fetchCustomBanks = async () => {
    if (!user?.id) {
      setCustomBanks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('custom_banks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCustomBanks((data as any) || []);
    } catch (err) {
      devError('Erro ao buscar bancos customizados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createCustomBank = async (bankData: {
    name: string;
    short_name: string;
    website?: string;
    description?: string;
    primary_color?: string;
    secondary_color?: string;
  }): Promise<CustomBank | null> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error } = await (supabase as any)
        .from('custom_banks')
        .insert([{
          user_id: user.id,
          ...bankData,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Atualizar lista local
      setCustomBanks(prev => [(data as any), ...prev]);
      
      return (data as any);
    } catch (err) {
      devError('Erro ao criar banco customizado:', err);
      throw err;
    }
  };

  const updateCustomBank = async (bankId: string, updates: Partial<{
    name: string;
    short_name: string;
    website?: string;
    description?: string;
    primary_color?: string;
    secondary_color?: string;
    is_active: boolean;
  }>): Promise<CustomBank | null> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error } = await (supabase as any)
        .from('custom_banks')
        .update(updates)
        .eq('id', bankId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Atualizar lista local
      setCustomBanks(prev => 
        prev.map(bank => bank.id === bankId ? (data as any) : bank)
      );
      
      return (data as any);
    } catch (err) {
      devError('Erro ao atualizar banco customizado:', err);
      throw err;
    }
  };

  const deleteCustomBank = async (bankId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { error } = await (supabase as any)
        .from('custom_banks')
        .update({ is_active: false })
        .eq('id', bankId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Atualizar lista local
      setCustomBanks(prev => 
        prev.filter(bank => bank.id !== bankId)
      );
    } catch (err) {
      devError('Erro ao deletar banco customizado:', err);
      throw err;
    }
  };

  const getCustomBankById = (bankId: string): CustomBank | undefined => {
    return customBanks.find(bank => bank.id === bankId);
  };

  const searchCustomBanks = (query: string): CustomBank[] => {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      return customBanks;
    }

    return customBanks.filter(bank => 
      bank.name.toLowerCase().includes(normalizedQuery) ||
      bank.short_name.toLowerCase().includes(normalizedQuery)
    );
  };

  useEffect(() => {
    fetchCustomBanks();
  }, [user?.id]);

  return {
    customBanks,
    loading,
    error,
    fetchCustomBanks,
    createCustomBank,
    updateCustomBank,
    deleteCustomBank,
    getCustomBankById,
    searchCustomBanks
  };
};
