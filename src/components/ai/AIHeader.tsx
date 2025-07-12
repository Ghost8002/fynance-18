
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Trash2, Plus, History } from 'lucide-react';

interface AIHeaderProps {
  chatHistoryLength: number;
  loading: boolean;
  onClearHistory: () => void;
  onNewChat: () => void;
  onShowHistory: () => void;
}

const AIHeader = ({ 
  chatHistoryLength, 
  loading, 
  onClearHistory, 
  onNewChat,
  onShowHistory
}: AIHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 backdrop-blur-md bg-background/95 border-b border-border/50">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Assistente Financeiro IA
              </h2>
              <p className="text-sm text-muted-foreground">
                Seu consultor financeiro pessoal inteligente
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {chatHistoryLength > 0 && (
              <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                {chatHistoryLength} {chatHistoryLength === 1 ? 'mensagem' : 'mensagens'}
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onShowHistory}
              disabled={loading}
              className="hover:bg-secondary/80 border-border/50"
            >
              <History className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Histórico</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNewChat}
              disabled={loading}
              className="hover:bg-primary/10 hover:text-primary border-primary/20"
            >
              <Plus className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Nova Conversa</span>
            </Button>
            
            {chatHistoryLength > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                disabled={loading}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIHeader;
