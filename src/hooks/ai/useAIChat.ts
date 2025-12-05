
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessage } from './types';
import { toast } from 'sonner';

interface AIChatHistoryRow {
  id: string;
  user_id: string;
  message: string;
  ai_response: string;
  tokens_used: number;
  created_at: string;
}

export const useAIChat = () => {
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { user } = useAuth();

  const loadChatHistory = async (sessionId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // If sessionId is provided, filter by date
      if (sessionId) {
        const sessionDate = new Date(sessionId);
        const startOfDay = new Date(sessionDate.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(sessionDate.setHours(23, 59, 59, 999)).toISOString();
        
        query = query
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);
      } else {
        // Load only today's messages for current session
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
        
        query = query
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        return;
      }

      const history: ChatMessage[] = (data as AIChatHistoryRow[]).map(item => ({
        id: item.id,
        message: item.message,
        response: item.ai_response,
        timestamp: new Date(item.created_at),
        isUser: true
      }));

      setChatHistory(history);
    } catch (error) {
      // Silent error handling
    }
  };

  const clearChatHistory = async () => {
    // Nova funcionalidade: apenas limpa o estado local, mantém o histórico no banco
    setChatHistory([]);
  };

  const startNewConversation = async () => {
    // Função específica para iniciar nova conversa sem excluir histórico
    if (!user) return;

    try {
      // Apenas limpa o estado local da conversa atual
      // O histórico permanece salvo no banco de dados
      setChatHistory([]);
      toast.success('Nova conversa iniciada! A conversa anterior foi salva no histórico.');
    } catch (error) {
      toast.error('Erro ao iniciar nova conversa');
    }
  };

  const permanentlyDeleteHistory = async () => {
    if (!user) return;

    try {
      // Função para excluir permanentemente (apenas se necessário)
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { error } = await supabase
        .from('ai_chat_history')
        .delete()
        .eq('user_id', user.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (error) {
        toast.error('Erro ao excluir histórico');
        return;
      }

      setChatHistory([]);
      toast.success('Histórico excluído permanentemente');
    } catch (error) {
      toast.error('Erro ao excluir histórico');
    }
  };

  const saveChatMessage = async (message: string, aiResponse: string, tokensUsed: number = 0) => {
    if (!user) return;

    try {
      const insertData = {
        user_id: user.id,
        message: message.trim(),
        ai_response: aiResponse,
        tokens_used: tokensUsed
      };

      const { error: saveError } = await supabase
        .from('ai_chat_history')
        .insert(insertData);

      if (saveError) {
        // Silent error - don't interrupt user experience
      }
    } catch (saveError) {
      // Silent error - don't interrupt user experience
    }
  };

  const addToHistory = (message: string, response: string, crudOperation?: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      message: message.trim(),
      response: response,
      timestamp: new Date(),
      isUser: true,
      crudOperation: crudOperation ? {
        executed: true,
        operation: crudOperation,
        result: crudOperation
      } : undefined
    };

    setChatHistory(prev => [...prev, newMessage]);
  };

  return {
    loading,
    setLoading,
    chatHistory,
    loadChatHistory,
    clearChatHistory,
    startNewConversation,
    permanentlyDeleteHistory,
    saveChatMessage,
    addToHistory
  };
};
