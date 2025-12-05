import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatSession {
  id: string;
  created_at: string;
  message_count: number;
  last_message: string;
}

interface AIChatSessionsProps {
  onSessionSelect: (sessionId: string) => void;
  onBack: () => void;
  currentSessionId?: string;
}

const AIChatSessions = ({ onSessionSelect, onBack, currentSessionId }: AIChatSessionsProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('id, created_at, message, ai_response')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return;
      }

      // Group messages by date to create sessions
      const sessionsMap = new Map<string, ChatSession>();
      
      data?.forEach(item => {
        const date = new Date(item.created_at).toDateString();
        
        if (!sessionsMap.has(date)) {
          sessionsMap.set(date, {
            id: date,
            created_at: item.created_at,
            message_count: 0,
            last_message: item.message
          });
        }
        
        const session = sessionsMap.get(date)!;
        session.message_count += 1;
        
        // Keep the most recent message as the last message
        if (new Date(item.created_at) > new Date(session.created_at)) {
          session.last_message = item.message;
          session.created_at = item.created_at;
        }
      });

      setSessions(Array.from(sessionsMap.values()));
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">Histórico de Conversas</h3>
            <p className="text-sm text-muted-foreground">
              {sessions.length} {sessions.length === 1 ? 'conversa' : 'conversas'} encontradas
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Inicie uma conversa para vê-la aparecer aqui
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  currentSessionId === session.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-primary/50'
                }`}
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(session.created_at)}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {session.message_count} {session.message_count === 1 ? 'mensagem' : 'mensagens'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {session.last_message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(session.created_at).toLocaleString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AIChatSessions;
