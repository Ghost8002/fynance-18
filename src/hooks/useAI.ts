
import { useAIChat } from './ai/useAIChat';
import { useAIFinancialData } from './ai/useAIFinancialData';
import { useAIPrompts } from './ai/useAIPrompts';
import { useAICRUD } from './useAICRUD';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    setLoading(true);
    
    try {
      console.log('Sending message:', userMessage);

      // Get financial context for the AI
      const financialContext = prepareUserData();
      console.log('Financial context prepared:', financialContext);
      
      // Check if message contains CRUD operations
      const crudOperation = parseNaturalLanguageCommand(userMessage);
      let crudResult = null;
      
      if (crudOperation) {
        console.log('Executing CRUD operation:', crudOperation);
        crudResult = await executeOperation(crudOperation);
        console.log('CRUD result:', crudResult);
      }

      // Call Supabase Edge Function
      console.log('Calling edge function...');
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage,
          userData: financialContext,
          crudResult: crudResult
        }
      });

      if (error) {
        console.error('Error calling AI function:', error);
        throw new Error('Erro ao processar mensagem');
      }

      if (!data?.response) {
        console.error('Invalid response data:', data);
        throw new Error('Resposta inválida do assistente');
      }

      console.log('AI response received:', data.response);

      // Add complete conversation to history
      addToHistory(userMessage, data.response, crudResult);
      
      // Save to database
      await saveChatMessage(userMessage, data.response, data.tokensUsed || 0);

    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast.error(error instanceof Error ? error.message : 'Erro inesperado');
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
