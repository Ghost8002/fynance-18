import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useSubscription } from "@/context/SubscriptionContext";
import { motion } from "framer-motion";
export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    checkSubscription
  } = useSubscription();
  const sessionId = searchParams.get("session_id");

  // Refresh subscription status after successful checkout
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-green-500/5 flex items-center justify-center px-4">
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5
    }} className="w-full max-w-md">
        <Card className="border-green-500/20 shadow-xl shadow-green-500/5">
          <CardHeader className="text-center pb-4">
            <motion.div initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200
          }} className="mx-auto mb-4">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl text-foreground">Assinatura ativada!</CardTitle>
          </CardHeader>
          
          <CardContent className="text-center pb-8">
            <p className="text-muted-foreground mb-6">
              Parabéns! Sua assinatura Pro foi ativada com sucesso. Agora você tem acesso a todas as funcionalidades do sistema.
            </p>

            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary/10 text-primary mb-8">
              
              <span className="text-sm font-medium">Plano Pro ativo</span>
            </div>

            <div className="space-y-3">
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Ir para o Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button variant="ghost" onClick={() => navigate("/configuracoes")} className="w-full">
                Configurações da conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>;
}