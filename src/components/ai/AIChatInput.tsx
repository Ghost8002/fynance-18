import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Mic, MicOff, WifiOff, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { devError, devLog } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface AIChatInputProps {
  loading: boolean;
  isOnline: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onQueueMessage: (message: string) => Promise<void>;
}

// Mapeamento de erros de reconhecimento de voz para mensagens amigáveis
const getVoiceErrorMessage = (error: string): string => {
  switch (error) {
    case 'no-speech':
      return 'Nenhuma fala detectada. Tente novamente.';
    case 'audio-capture':
      return 'Microfone não encontrado. Verifique as permissões.';
    case 'not-allowed':
      return 'Permissão de microfone negada. Habilite nas configurações.';
    case 'network':
      return 'Erro de rede. Verifique sua conexão.';
    case 'aborted':
      return 'Captura de voz cancelada.';
    case 'service-not-allowed':
      return 'Serviço de voz não permitido neste navegador.';
    default:
      return 'Erro ao capturar voz. Tente novamente.';
  }
};

const AIChatInput = ({
  loading,
  isOnline,
  onSendMessage,
  onQueueMessage,
}: AIChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceRetryCount, setVoiceRetryCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cleanup recognition on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

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
      if (isOnline) {
        await onSendMessage(userMessage);
      } else {
        // Queue for later when offline
        await onQueueMessage(userMessage);
        toast.info('Mensagem salva! Será enviada quando a internet voltar.', {
          icon: <Clock className="h-4 w-4" />,
        });
      }
    } catch (error) {
      // Error is already handled
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

  // Função para parar reconhecimento de forma segura
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        devError('Erro ao parar reconhecimento:', e);
      }
      recognitionRef.current = null;
    }
    if (isMountedRef.current) {
      setIsListening(false);
    }
  }, []);

  // Função para iniciar reconhecimento com retry
  const startRecognition = useCallback(async () => {
    // Verificar suporte
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return false;
    }

    // Verificar permissão de microfone primeiro
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Liberar o stream imediatamente após verificar permissão
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      devError('Erro de permissão do microfone:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Permissão de microfone negada. Habilite nas configurações do navegador.');
      } else if (error.name === 'NotFoundError') {
        toast.error('Microfone não encontrado. Conecte um microfone e tente novamente.');
      } else {
        toast.error('Erro ao acessar microfone. Verifique as permissões.');
      }
      return false;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true; // Mostrar resultados intermediários
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (isMountedRef.current) {
          setIsListening(true);
          setVoiceRetryCount(0);
          toast.success('🎤 Escutando... Fale agora!', { duration: 2000 });
        }
      };

      recognition.onresult = async (event: any) => {
        if (!isMountedRef.current) return;

        const results = event.results;
        const lastResult = results[results.length - 1];
        const transcript = lastResult[0].transcript;
        const isFinal = lastResult.isFinal;

        // Atualizar texto conforme fala (resultados intermediários)
        setMessage(transcript);

        // Quando finalizado, enviar a mensagem
        if (isFinal && transcript.trim()) {
          devLog('Transcrição final:', transcript);
          setIsListening(false);
          recognitionRef.current = null;

          // Delay para mostrar o texto antes de enviar
          setTimeout(async () => {
            if (!isMountedRef.current) return;
            
            try {
              if (isOnline) {
                await onSendMessage(transcript.trim());
              } else {
                await onQueueMessage(transcript.trim());
                toast.info('Mensagem de voz salva! Será enviada quando a internet voltar.', {
                  icon: <Clock className="h-4 w-4" />,
                });
              }
              setMessage('');
            } catch (error) {
              devError('Erro ao enviar mensagem de voz:', error);
              // Manter o texto no input para o usuário tentar novamente
              toast.error('Erro ao enviar. Tente novamente.');
            }
          }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        if (!isMountedRef.current) return;
        
        const errorMessage = getVoiceErrorMessage(event.error);
        devError('Erro no reconhecimento de voz:', event.error);

        // Para erros de "no-speech", tentar novamente automaticamente (máximo 2 vezes)
        if (event.error === 'no-speech' && voiceRetryCount < 2) {
          setVoiceRetryCount(prev => prev + 1);
          toast.info('Nenhuma fala detectada. Tentando novamente...', { duration: 2000 });
          
          // Pequeno delay antes de reiniciar
          setTimeout(() => {
            if (isMountedRef.current && isListening) {
              try {
                recognition.start();
              } catch (e) {
                stopRecognition();
                toast.error(errorMessage);
              }
            }
          }, 500);
          return;
        }

        // Para erros abortados pelo usuário, não mostrar erro
        if (event.error === 'aborted') {
          setIsListening(false);
          return;
        }

        stopRecognition();
        toast.error(errorMessage);
      };

      recognition.onend = () => {
        // Só atualizar estado se não for um retry
        if (isMountedRef.current && voiceRetryCount >= 2) {
          setIsListening(false);
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (error) {
      devError('Erro ao iniciar reconhecimento de voz:', error);
      toast.error('Erro ao ativar reconhecimento de voz. Tente novamente.');
      if (isMountedRef.current) {
        setIsListening(false);
      }
      return false;
    }
  }, [isOnline, onSendMessage, onQueueMessage, voiceRetryCount, isListening, stopRecognition]);

  const toggleVoiceInput = useCallback(async () => {
    if (isListening) {
      stopRecognition();
      toast.info('Captura de voz cancelada');
      return;
    }

    await startRecognition();
  }, [isListening, stopRecognition, startRecognition]);

  return (
    <div className="sticky bottom-0 backdrop-blur-md bg-background/95 border-t border-border/50">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
          <WifiOff className="h-4 w-4" />
          <span>Modo offline - mensagens serão enviadas quando a internet voltar</span>
        </div>
      )}

      <div className="p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-1.5 sm:gap-3">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isOnline ? "Digite sua pergunta..." : "Digite (será enviado quando online)..."}
                disabled={loading}
                maxLength={500}
                className={cn(
                  "min-h-[44px] sm:min-h-[48px] text-sm sm:text-base rounded-xl border-border/50 bg-card/50 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20 px-3 sm:px-4",
                  !isOnline && "border-amber-500/30"
                )}
              />
            </div>

            <Button
              onClick={toggleVoiceInput}
              disabled={loading}
              size="lg"
              variant={isListening ? "default" : "outline"}
              className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl transition-all duration-200",
                isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'hover:bg-accent'
              )}
              title="Reconhecimento de voz"
            >
              {isListening ? (
                <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>

            <Button
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
              size="lg"
              className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200",
                isOnline
                  ? "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  : "bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : !isOnline ? (
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatInput;
