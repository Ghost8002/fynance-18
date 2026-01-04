import { useState, useCallback } from 'react';
import { useAIChat } from './ai/useAIChat';
import { useAIFinancialData } from './ai/useAIFinancialData';
import { useAICRUD, CRUDOperation } from './useAICRUD';
import { toast } from 'sonner';
import { devLog, devError } from '@/utils/logger';

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

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
  
  const { prepareUserData, categories, accounts, goals } = useAIFinancialData();
  const { executeOperation } = useAICRUD();
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Process tool calls from AI response
  const processToolCalls = useCallback(async (toolCalls: ToolCall[]): Promise<{success: boolean; message: string; data?: any}[]> => {
    const results: {success: boolean; message: string; data?: any}[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        let operation: CRUDOperation | null = null;

        switch (toolCall.function.name) {
          case 'create_transaction':
            const category = categories.find(c => 
              c.name.toLowerCase().includes(args.category_name?.toLowerCase() || '')
            );
            const account = accounts.find(a => 
              a.name.toLowerCase().includes(args.account_name?.toLowerCase() || '')
            );
            operation = {
              operation: 'create',
              table: 'transactions',
              data: {
                description: args.description,
                amount: args.amount,
                date: args.date || new Date().toISOString().split('T')[0],
                type: args.type,
                category_id: category?.id,
                account_id: account?.id
              }
            };
            break;

          case 'update_transactions_by_filter':
            const targetCategory = categories.find(c => 
              c.name.toLowerCase().includes(args.new_category_name?.toLowerCase() || '')
            );
            if (targetCategory) {
              operation = {
                operation: 'update',
                table: 'transactions',
                conditions: { description_contains: args.filter_description },
                data: { category_id: targetCategory.id }
              };
            }
            break;

          case 'delete_transaction':
            operation = {
              operation: 'delete',
              table: 'transactions',
              conditions: { description_contains: args.description_contains }
            };
            break;

          case 'create_category':
            operation = {
              operation: 'create',
              table: 'categories',
              data: {
                name: args.name,
                type: args.type,
                color: args.color || '#3B82F6'
              }
            };
            break;

          case 'create_goal':
            operation = {
              operation: 'create',
              table: 'goals',
              data: {
                title: args.title,
                target_amount: args.target_amount,
                current_amount: 0,
                deadline: args.deadline,
                description: args.description,
                status: 'active'
              }
            };
            break;

          case 'update_goal':
            const goal = goals.find(g => 
              g.title.toLowerCase().includes(args.goal_title?.toLowerCase() || '')
            );
            if (goal) {
              const updateData: any = {};
              if (args.add_amount) {
                updateData.current_amount = (goal.current_amount || 0) + args.add_amount;
              }
              if (args.new_target) {
                updateData.target_amount = args.new_target;
              }
              if (args.new_deadline) {
                updateData.deadline = args.new_deadline;
              }
              operation = {
                operation: 'update',
                table: 'goals',
                id: goal.id,
                data: updateData
              };
            }
            break;

          case 'create_account':
            operation = {
              operation: 'create',
              table: 'accounts',
              data: {
                name: args.name,
                type: args.type,
                balance: args.balance || 0,
                bank: args.bank
              }
            };
            break;

          case 'list_transactions':
            operation = {
              operation: 'read',
              table: 'transactions',
              conditions: {
                ...(args.category_name && { category_name: args.category_name }),
                ...(args.description_contains && { description_contains: args.description_contains }),
                ...(args.type && { type: args.type }),
                ...(args.limit && { limit: args.limit })
              }
            };
            break;
        }

        if (operation) {
          const result = await executeOperation(operation);
          results.push(result);
        }
      } catch (error) {
        devError('Error processing tool call:', error);
        results.push({
          success: false,
          message: `Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      }
    }

    return results;
  }, [categories, accounts, goals, executeOperation]);

  // Stream chat response
  const sendMessage = async (userMessage: string) => {
    if (!userMessage?.trim()) {
      toast.error('Por favor, digite uma mensagem válida');
      return;
    }

    setLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      devLog('Sending message:', userMessage);
      const financialContext = prepareUserData();

      // Use environment variable for the URL
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: userMessage.trim(),
          userData: financialContext,
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Aguarde alguns segundos.');
        }
        if (response.status === 402) {
          throw new Error('Créditos insuficientes. Adicione créditos para continuar.');
        }
        throw new Error(errorData.error || 'Erro ao processar mensagem');
      }

      if (!response.body) {
        throw new Error('Resposta sem conteúdo');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullResponse = '';
      let toolCalls: ToolCall[] = [];
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            const deltaToolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            
            if (content) {
              fullResponse += content;
              setStreamingMessage(fullResponse);
            }
            
            if (deltaToolCalls) {
              // Accumulate tool calls
              for (const tc of deltaToolCalls) {
                if (tc.index !== undefined) {
                  if (!toolCalls[tc.index]) {
                    toolCalls[tc.index] = { id: tc.id || '', function: { name: '', arguments: '' } };
                  }
                  if (tc.function?.name) {
                    toolCalls[tc.index].function.name = tc.function.name;
                  }
                  if (tc.function?.arguments) {
                    toolCalls[tc.index].function.arguments += tc.function.arguments;
                  }
                }
              }
            }
          } catch {
            // Partial JSON, put back in buffer
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Process any tool calls
      let crudResults: any[] = [];
      if (toolCalls.length > 0) {
        devLog('Processing tool calls:', toolCalls);
        crudResults = await processToolCalls(toolCalls.filter(tc => tc?.function?.name));
        
        // Show toast for each result
        crudResults.forEach(result => {
          if (result.success) {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        });
      }

      // Add to history
      const crudResult = crudResults.length > 0 ? {
        executed: true,
        operations: toolCalls.map(tc => tc?.function?.name).filter(Boolean),
        results: crudResults
      } : undefined;

      addToHistory(userMessage, fullResponse || 'Operação executada com sucesso.', crudResult);
      
      try {
        await saveChatMessage(userMessage, fullResponse || 'Operação executada.', 0);
      } catch (saveError) {
        devError('Error saving message:', saveError);
      }

    } catch (error) {
      devError('Error in sendMessage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  return {
    sendMessage,
    loading,
    isStreaming,
    streamingMessage,
    chatHistory,
    loadChatHistory,
    clearChatHistory,
    startNewConversation,
    permanentlyDeleteHistory
  };
};
