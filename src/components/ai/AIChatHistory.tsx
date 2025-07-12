
import { Badge } from '@/components/ui/badge';
import { Bot, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/hooks/ai/types';
import MarkdownRenderer from './MarkdownRenderer';

interface AIChatHistoryProps {
  chatHistory: ChatMessage[];
  loading: boolean;
}

const AIChatHistory = ({ chatHistory, loading }: AIChatHistoryProps) => {
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
              
              {/* CRUD Operation Status */}
              {chat.crudOperation && (
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
      
      {loading && (
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm flex-shrink-0 mt-1">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Assistente IA</p>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/50 dark:to-emerald-950/20 rounded-2xl rounded-tl-md p-4 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                <span className="text-sm text-muted-foreground">Analisando suas finanças e processando solicitação...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatHistory;
