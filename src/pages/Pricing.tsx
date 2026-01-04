import { Check, Sparkles, Shield, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  "Suporte prioritário",
];

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const { isSubscribed, subscriptionEnd, openCheckout, openCustomerPortal, isLoading } = useSubscription();
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Plano Premium</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Assuma o controle das suas finanças
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Todas as ferramentas que você precisa para organizar suas finanças pessoais em um único lugar.
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="max-w-md mx-auto border-primary/20 shadow-xl shadow-primary/5">
          <CardHeader className="text-center pb-8 pt-8">
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
            <div className="mt-6">
              <span className="text-5xl font-bold text-foreground">R$ 15,00</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </CardHeader>
          
          <CardContent className="pb-8">
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {isSubscribed && subscriptionEnd && (
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  Sua assinatura renova em{" "}
                  <span className="font-medium text-foreground">
                    {format(new Date(subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-8">
            {isSubscribed ? (
              <Button 
                onClick={handleManageSubscription} 
                variant="outline" 
                className="w-full"
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
                className="w-full h-12 text-lg"
                disabled={checkoutLoading || isLoading}
              >
                {checkoutLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Começar agora
              </Button>
            )}
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Pagamento seguro via Stripe</span>
            </div>
          </CardFooter>
        </Card>

        {/* Back link */}
        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
