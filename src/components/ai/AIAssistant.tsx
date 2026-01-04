import { useEffect, useState } from 'react';
import { useAI } from '@/hooks/useAI';
import { useOfflineAIMessages } from '@/hooks/useOfflineAIMessages';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import AIHeader from './AIHeader';
import AIWelcome from './AIWelcome';
import AIChatHistory from './AIChatHistory';
import AIChatInput from './AIChatInput';
import AIChatSessions from './AIChatSessions';
import AIPendingMessages from './AIPendingMessages';

const AIAssistant = () => {
  const { 
    sendMessage, 
    loading, 
    isStreaming,
    streamingMessage,
    chatHistory, 
    loadChatHistory, 
    startNewConversation, 
    permanentlyDeleteHistory 
  } = useAI();
  
  const {
    pendingMessages,
    isSyncing,
    isOnline,
    queueMessage,
    retryMessage,
    removeMessage,
    pendingCount,
  } = useOfflineAIMessages({ onSendMessage: sendMessage });

  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>();

  useEffect(() => {
    loadChatHistory();
  }, []);

  const handleSendMessage = async (userMessage: string) => {
    try {
      await sendMessage(userMessage);
    } catch (error) {
      // Error is already handled in useAI hook
    }
  };

  const handleQueueMessage = async (userMessage: string) => {
    await queueMessage(userMessage);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente todo o histórico de conversas? Esta ação não pode ser desfeita.')) {
      await permanentlyDeleteHistory();
      toast.success('Histórico excluído permanentemente!');
    }
  };

  const handleNewChat = async () => {
    if (chatHistory.length > 0) {
      if (window.confirm('Deseja iniciar uma nova conversa? A conversa atual será salva no histórico.')) {
        await startNewConversation();
      }
    } else {
      await startNewConversation();
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
  };

  const handleSessionSelect = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowHistory(false);
    await loadChatHistory(sessionId);
    toast.success('Conversa carregada!');
  };

  const handleBackFromHistory = () => {
    setShowHistory(false);
    loadChatHistory();
  };

  if (showHistory) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col bg-gradient-to-br from-background via-background to-muted/10 rounded-lg overflow-hidden border shadow-sm">
        <AIChatSessions
          onSessionSelect={handleSessionSelect}
          onBack={handleBackFromHistory}
          currentSessionId={currentSessionId}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] flex flex-col bg-gradient-to-br from-background via-background to-muted/10 rounded-lg overflow-hidden border shadow-sm">
      <AIHeader 
        chatHistoryLength={chatHistory.length}
        loading={loading}
        onClearHistory={handleClearHistory}
        onNewChat={handleNewChat}
        onShowHistory={handleShowHistory}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
      />

      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <div className="p-3 sm:p-6">
            {/* Pending messages (offline queue) */}
            {pendingMessages.length > 0 && (
              <AIPendingMessages
                messages={pendingMessages}
                onRetry={retryMessage}
                onRemove={removeMessage}
                isOnline={isOnline}
              />
            )}

            {chatHistory.length === 0 && !isStreaming && pendingMessages.length === 0 ? (
              <AIWelcome />
            ) : (
              <AIChatHistory 
                chatHistory={chatHistory}
                loading={loading}
                isStreaming={isStreaming}
                streamingMessage={streamingMessage}
              />
            )}
          </div>
        </ScrollArea>

        <AIChatInput 
          loading={loading}
          isOnline={isOnline}
          onSendMessage={handleSendMessage}
          onQueueMessage={handleQueueMessage}
        />
      </div>
    </div>
  );
};

export default AIAssistant;
