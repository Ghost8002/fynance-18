import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/context/SubscriptionContext";
import { motion } from "framer-motion";
import { useState } from "react";

export default function CheckoutCanceled() {
  const navigate = useNavigate();
  const { openCheckout } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      await openCheckout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-destructive/20 shadow-xl shadow-destructive/5">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl text-foreground">Pagamento cancelado</CardTitle>
          </CardHeader>
          
          <CardContent className="text-center pb-8">
            <p className="text-muted-foreground mb-8">
              Você cancelou o processo de pagamento. Não se preocupe, nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
            </p>

            <div className="space-y-3">
              <Button 
                onClick={handleRetry} 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Tentar novamente
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o início
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
