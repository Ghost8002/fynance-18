
import { useAIChat } from './ai/useAIChat';
import { useAIFinancialData } from './ai/useAIFinancialData';
import { useAIPrompts } from './ai/useAIPrompts';
import { useAICRUD } from './useAICRUD';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { devLog, devError } from '@/utils/logger';

export const useAI = () => {
  const { 
    loading, 
    setLoading, 
    chatHistory, 
    loadChatHistory, 
    clearChatHistory, 
    startNewConversation,
    permanentlyDeleteHistory,
    saveChatMessage, 
    addToHistory 
  } = useAIChat();
  const { prepareUserData } = useAIFinancialData();
  const { buildFinancialPromptWithCRUD } = useAIPrompts();
  const { executeOperation, parseNaturalLanguageCommand } = useAICRUD();

  const sendMessage = async (userMessage: string) => {
    if (!userMessage || !userMessage.trim()) {
      toast.error('Por favor, digite uma mensagem válida');
      return;
    }

    setLoading(true);
    
    try {
      devLog('Sending message:', userMessage);

      // Get financial context for the AI
      const financialContext = prepareUserData();
      devLog('Financial context prepared:', financialContext);
      
      // Check if message contains CRUD operations
      const crudOperation = parseNaturalLanguageCommand(userMessage);
      let crudResult = null;
      
      if (crudOperation) {
        devLog('Executing CRUD operation:', crudOperation);
        try {
          crudResult = await executeOperation(crudOperation);
          devLog('CRUD result:', crudResult);
        } catch (crudError) {
          devError('CRUD operation failed:', crudError);
          // Continue with AI response even if CRUD fails
          crudResult = {
            success: false,
            message: `Erro na operação: ${crudError instanceof Error ? crudError.message : 'Erro desconhecido'}`
          };
        }
      }

      // Call Supabase Edge Function
      devLog('Calling edge function...');
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage.trim(),
          userData: financialContext,
          crudResult: crudResult
        }
      });

      devLog('Edge function response:', { data, error });

      if (error) {
        devError('Error calling AI function:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('Failed to fetch')) {
          throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
        } else if (error.message?.includes('API key')) {
          throw new Error('Chave da API não configurada. Entre em contato com o suporte.');
        } else {
          throw new Error(`Erro do servidor: ${error.message || 'Erro desconhecido'}`);
        }
      }

      if (!data?.response) {
        devError('Invalid response data:', data);
        throw new Error('Resposta inválida do assistente. Tente novamente.');
      }

      devLog('AI response received:', data.response);

      // Add complete conversation to history
      addToHistory(userMessage, data.response, crudResult);
      
      // Save to database
      try {
        await saveChatMessage(userMessage, data.response, data.tokensUsed || 0);
      } catch (saveError) {
        devError('Error saving chat message:', saveError);
        // Don't throw error for save failure, just log it
      }

    } catch (error) {
      devError('Error in sendMessage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao processar mensagem';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    loading,
    chatHistory,
    loadChatHistory,
    clearChatHistory,
    startNewConversation,
    permanentlyDeleteHistory
  };
};
