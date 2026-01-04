
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
      <div className="p-3 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shrink-0">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                Assistente IA
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Seu consultor financeiro pessoal inteligente
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {chatHistoryLength > 0 && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-3 py-0.5 sm:py-1 hidden xs:flex">
                {chatHistoryLength}
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onShowHistory}
              disabled={loading}
              className="hover:bg-secondary/80 border-border/50 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
            >
              <History className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Histórico</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNewChat}
              disabled={loading}
              className="hover:bg-primary/10 hover:text-primary border-primary/20 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
            >
              <Plus className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Nova</span>
            </Button>
            
            {chatHistoryLength > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                disabled={loading}
                className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
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
