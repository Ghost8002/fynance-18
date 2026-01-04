import { Clock, Zap } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Formata tempo restante em mm:ss
const formatTimeRemaining = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

interface TrialBannerProps {
  compact?: boolean;
}

export const TrialBanner = ({ compact = false }: TrialBannerProps) => {
  const { isInTrial, trialTimeRemaining, isSubscribed } = useSubscription();
  const navigate = useNavigate();

  // Não mostrar se já está assinado ou não está em trial
  if (isSubscribed || !isInTrial) {
    return null;
  }

  // Tempo baixo = menos de 3 minutos
  const isLowTime = trialTimeRemaining < 3 * 60 * 1000;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${
          isLowTime 
            ? 'bg-destructive/10 border border-destructive/30' 
            : 'bg-primary/10 border border-primary/30'
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${isLowTime ? 'text-destructive animate-pulse' : 'text-primary'}`} />
          <span className="text-sm font-medium text-foreground">
            Trial: <span className={`font-mono font-bold ${isLowTime ? 'text-destructive' : 'text-primary'}`}>
              {formatTimeRemaining(trialTimeRemaining)}
            </span>
          </span>
        </div>
        <Button 
          size="sm" 
          variant={isLowTime ? "destructive" : "default"}
          onClick={() => navigate('/precos')}
          className="h-7 text-xs"
        >
          Assinar
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl ${
        isLowTime 
          ? 'bg-destructive/10 border border-destructive/30' 
          : 'bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isLowTime ? 'bg-destructive/20' : 'bg-primary/20'}`}>
          <Clock className={`h-5 w-5 ${isLowTime ? 'text-destructive animate-pulse' : 'text-primary'}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isLowTime ? 'Seu trial está acabando!' : 'Você está no período de teste'}
          </p>
          <p className="text-xs text-muted-foreground">
            Tempo restante: <span className={`font-mono font-bold text-base ${isLowTime ? 'text-destructive' : 'text-primary'}`}>
              {formatTimeRemaining(trialTimeRemaining)}
            </span>
          </p>
        </div>
      </div>
      
      <Button 
        size="sm" 
        variant={isLowTime ? "destructive" : "default"}
        onClick={() => navigate('/precos')}
        className="gap-2"
      >
        <Zap className="h-4 w-4" />
        Assinar agora
      </Button>
    </motion.div>
  );
};