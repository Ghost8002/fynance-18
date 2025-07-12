
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface AIChatInputProps {
  loading: boolean;
  onSendMessage: (message: string) => Promise<void>;
}

const AIChatInput = ({ loading, onSendMessage }: AIChatInputProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');

    try {
      await onSendMessage(userMessage);
    } catch (error) {
      // Error is already handled in useAI hook
    }

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="sticky bottom-0 backdrop-blur-md bg-background/95 border-t border-border/50">
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta sobre finanças..."
                disabled={loading}
                maxLength={500}
                className="min-h-[48px] text-base rounded-xl border-border/50 bg-card/50 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
                <span className={`transition-colors ${message.length > 450 ? 'text-destructive' : ''}`}>
                  {message.length}/500 caracteres
                </span>
                <span className="hidden sm:inline">Pressione Enter para enviar</span>
              </div>
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !message.trim()}
              size="lg"
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatInput;
