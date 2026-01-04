
import { useEffect, useRef } from 'react';
import { Bot, User, CheckCircle, XCircle, Zap } from 'lucide-react';
import { ChatMessage } from '@/hooks/ai/types';
import MarkdownRenderer from './MarkdownRenderer';

interface AIChatHistoryProps {
  chatHistory: ChatMessage[];
  loading: boolean;
  isStreaming?: boolean;
  streamingMessage?: string;
}

const AIChatHistory = ({ chatHistory, loading, isStreaming, streamingMessage }: AIChatHistoryProps) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading, streamingMessage]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-4">
      {chatHistory.map((chat) => (
        <div key={chat.id} className="space-y-4">
          {/* User Message */}
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm flex-shrink-0 mt-1">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Você</p>
                <p className="text-xs text-muted-foreground">
                  {chat.timestamp.toLocaleString('pt-BR', { 
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-muted to-muted/50 rounded-2xl rounded-tl-md p-4 shadow-sm border border-border/50">
                <p className="text-sm leading-relaxed">{chat.message}</p>
              </div>
              
              {/* CRUD Operations Results */}
              {chat.crudOperation?.results && chat.crudOperation.results.length > 0 && (
                <div className="space-y-2">
                  {chat.crudOperation.results.map((result, idx) => (
                    <div key={idx} className={`rounded-lg p-3 border flex items-center gap-2 ${
                      result.success 
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }`}>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        {result.message}
                      </span>
                      {chat.crudOperation?.operations?.[idx] && (
                        <span className="ml-auto text-xs bg-background/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {chat.crudOperation.operations[idx]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Legacy single CRUD operation display */}
              {chat.crudOperation?.result && !chat.crudOperation.results && (
                <div className={`rounded-lg p-3 border ${
                  chat.crudOperation.result?.success 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {chat.crudOperation.result?.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      chat.crudOperation.result?.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {chat.crudOperation.result?.message || 'Operação executada'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Response */}
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm flex-shrink-0 mt-1">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Assistente IA</p>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/50 dark:to-emerald-950/20 rounded-2xl rounded-tl-md p-4 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="text-sm leading-relaxed text-foreground">
                  <MarkdownRenderer content={chat.response} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Streaming Message */}
      {isStreaming && streamingMessage && (
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm flex-shrink-0 mt-1">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Assistente IA</p>
              <span className="text-xs text-emerald-600 animate-pulse">digitando...</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/50 dark:to-emerald-950/20 rounded-2xl rounded-tl-md p-4 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="text-sm leading-relaxed text-foreground">
                <MarkdownRenderer content={streamingMessage} />
                <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-0.5"></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state when no streaming message yet */}
      {loading && !isStreaming && (
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm flex-shrink-0 mt-1">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Assistente IA</p>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/50 dark:to-emerald-950/20 rounded-2xl rounded-tl-md p-4 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm text-muted-foreground">Analisando suas finanças...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marcador de fim das mensagens para auto-scroll */}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default AIChatHistory;
