
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

interface AIChatInputProps {
  loading: boolean;
  onSendMessage: (message: string) => Promise<void>;
}

const AIChatInput = ({ loading, onSendMessage }: AIChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Atalho de teclado "/" para focar no input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !loading && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading]);

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

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        toast.success('Escutando... Fale agora!');
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        toast.success('Texto capturado!');
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        toast.error('Erro ao capturar voz');
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento de voz:', error);
      toast.error('Erro ao ativar reconhecimento de voz');
      setIsListening(false);
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
                <span className="hidden sm:inline">
                  {loading ? 'Processando...' : 'Pressione Enter ou / para focar'}
                </span>
              </div>
            </div>
            
            <Button
              onClick={toggleVoiceInput}
              disabled={loading}
              size="lg"
              variant={isListening ? "default" : "outline"}
              className={`h-12 w-12 rounded-xl transition-all duration-200 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'hover:bg-accent'
              }`}
              title="Reconhecimento de voz"
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>

            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !message.trim()}
              size="lg"
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
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
