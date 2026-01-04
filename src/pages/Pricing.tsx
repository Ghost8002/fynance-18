import { Check, Shield, CreditCard, Loader2, Clock, Zap, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const features = [
  "Transações ilimitadas",
  "Cartões de crédito ilimitados", 
  "Contas bancárias ilimitadas",
  "Metas financeiras",
  "Orçamentos por categoria",
  "Relatórios detalhados",
  "Assistente de IA",
  "Importação de extratos",
  "Calendário financeiro",
  "Suporte prioritário"
];

// Formata tempo restante em mm:ss
const formatTimeRemaining = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const {
    isSubscribed,
    subscriptionEnd,
    openCheckout,
    openCustomerPortal,
    isLoading,
    isInTrial,
    trialTimeRemaining,
    isTrialExpired
  } = useSubscription();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Redirect to dashboard if user is already subscribed
  useEffect(() => {
    if (isSubscribed && !isLoading) {
      navigate("/", { replace: true });
    }
  }, [isSubscribed, isLoading, navigate]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setCheckoutLoading(true);
    try {
      await openCheckout();
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setCheckoutLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 py-12 px-4 max-w-5xl mx-auto">
        {/* Trial Banner - Mostrado quando está em trial ou expirou */}
        {(isInTrial || isTrialExpired) && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-2xl border ${
              isTrialExpired 
                ? 'bg-destructive/10 border-destructive/30' 
                : 'bg-primary/10 border-primary/30'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              {isTrialExpired ? (
                <>
                  <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
                  <span className="text-lg font-semibold text-destructive">
                    Seu período de teste expirou!
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-6 w-6 text-primary animate-pulse" />
                  <span className="text-lg font-medium text-foreground">
                    Tempo restante do teste:
                  </span>
                  <span className="text-2xl font-bold text-primary font-mono">
                    {formatTimeRemaining(trialTimeRemaining)}
                  </span>
                </>
              )}
            </div>
            {isTrialExpired && (
              <p className="text-center text-muted-foreground mt-2">
                Assine agora para continuar usando todas as funcionalidades
              </p>
            )}
          </motion.div>
        )}

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Fynance Pro</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            {isTrialExpired 
              ? "Continue sua jornada financeira" 
              : "Assuma o controle das suas finanças"
            }
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isTrialExpired
              ? "Desbloqueie todas as ferramentas para organizar suas finanças pessoais"
              : "Todas as ferramentas que você precisa para organizar suas finanças pessoais em um único lugar."
            }
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              O que você vai ter acesso
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`border-2 shadow-2xl ${
              isTrialExpired 
                ? 'border-destructive/50 shadow-destructive/10' 
                : 'border-primary/30 shadow-primary/10'
            }`}>
              <CardHeader className="text-center pb-4 pt-8">
                {isSubscribed && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                      <Check className="h-3 w-3" />
                      Ativo
                    </span>
                  </div>
                )}
                
                <CardTitle className="text-2xl">{SUBSCRIPTION_TIERS.pro.name}</CardTitle>
                <CardDescription>Acesso completo a todas as funcionalidades</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl md:text-6xl font-bold text-foreground">R$ 15</span>
                    <span className="text-2xl text-muted-foreground">,00</span>
                  </div>
                  <span className="text-muted-foreground text-lg">/mês</span>
                </div>

                {/* Valor diário */}
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
                  <span>Menos de R$ 0,50 por dia</span>
                </div>
              </CardHeader>

              <CardContent className="pb-6">
                {isSubscribed && subscriptionEnd && (
                  <div className="p-4 rounded-lg bg-muted/50 border mb-4">
                    <p className="text-sm text-muted-foreground">
                      Sua assinatura renova em{" "}
                      <span className="font-medium text-foreground">
                        {format(new Date(subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </p>
                  </div>
                )}

                {isTrialExpired && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 mb-4">
                    <p className="text-sm text-destructive font-medium text-center">
                      🚀 Assine agora e não perca suas configurações!
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pb-8">
                {isSubscribed ? (
                  <Button 
                    onClick={handleManageSubscription} 
                    variant="outline" 
                    className="w-full h-12" 
                    disabled={checkoutLoading || isLoading}
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Gerenciar assinatura
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubscribe} 
                    className={`w-full h-14 text-lg font-semibold ${
                      isTrialExpired 
                        ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                        : ''
                    }`}
                    disabled={checkoutLoading || isLoading}
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Zap className="h-5 w-5 mr-2" />
                    )}
                    {isTrialExpired ? 'Assinar agora' : 'Começar agora'}
                  </Button>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Pagamento seguro via Stripe</span>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Cancele a qualquer momento. Sem compromisso.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>

        {/* Back link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </motion.div>
      </div>
    </div>
  );
}