import { Clock, RefreshCw, X, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PendingAIMessage } from '@/lib/offlineStorage';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AIPendingMessagesProps {
  messages: PendingAIMessage[];
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  isOnline: boolean;
}

const AIPendingMessages = ({ messages, onRetry, onRemove, isOnline }: AIPendingMessagesProps) => {
  if (messages.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <WifiOff className="h-4 w-4" />
        <span>Mensagens pendentes ({messages.length})</span>
      </div>

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            msg.status === 'failed' 
              ? "bg-red-500/5 border-red-500/20" 
              : msg.status === 'sending'
              ? "bg-primary/5 border-primary/20"
              : "bg-amber-500/5 border-amber-500/20"
          )}
        >
          {/* Status icon */}
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            msg.status === 'failed' 
              ? "bg-red-500/10" 
              : msg.status === 'sending'
              ? "bg-primary/10"
              : "bg-amber-500/10"
          )}>
            {msg.status === 'sending' ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : msg.status === 'failed' ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
          </div>

          {/* Message content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground line-clamp-2">
              {msg.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {msg.status === 'sending' ? (
                'Enviando...'
              ) : msg.status === 'failed' ? (
                `Falhou após ${msg.retryCount} tentativa(s)`
              ) : (
                <>
                  Aguardando conexão • {formatDistanceToNow(msg.timestamp, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {msg.status === 'failed' && isOnline && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => onRetry(msg.id)}
                title="Tentar novamente"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-500"
              onClick={() => onRemove(msg.id)}
              title="Remover"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AIPendingMessages;
