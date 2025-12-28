import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Trash2, Crown, CreditCard, Calendar, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { devError } from "@/utils/logger";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/context/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { isSubscribed, productId, subscriptionEnd, isLoading: subscriptionLoading, checkSubscription, openCheckout, openCustomerPortal } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast({
      title: "Atualizado",
      description: "Status da assinatura atualizado.",
    });
  };

  const getCurrentPlanName = () => {
    if (!isSubscribed || !productId) return null;
    const tier = Object.values(SUBSCRIPTION_TIERS).find(t => t.product_id === productId);
    return tier?.name || "Plano Ativo";
  };

  const formatSubscriptionEnd = () => {
    if (!subscriptionEnd) return null;
    try {
      return format(new Date(subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return subscriptionEnd;
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !password.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite sua senha para confirmar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First verify the password by attempting to sign in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (authError) {
        toast({
          title: "Erro",
          description: "Senha incorreta. Tente novamente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Call the delete account edge function
      const { error: deleteError } = await supabase.functions.invoke('delete-account');

      if (deleteError) {
        devError('Error deleting account:', deleteError);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a conta. Tente novamente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Logout and redirect
      await logout();
      navigate("/");
      
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso.",
      });
    } catch (error) {
      devError('Error deleting account:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
      setPassword("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Assinatura
                  {isSubscribed && (
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      Ativa
                    </Badge>
                  )}
                  {!isSubscribed && !subscriptionLoading && (
                    <Badge variant="secondary">
                      Gratuito
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Gerencie sua assinatura e plano
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshSubscription}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isSubscribed ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Plano Atual</Label>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-lg">{getCurrentPlanName()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Próxima Renovação</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">{formatSubscriptionEnd()}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={openCustomerPortal}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Gerenciar Assinatura
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                <p className="text-sm text-muted-foreground mb-4">
                  Você está usando o plano gratuito. Assine para desbloquear recursos premium como:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Assistente IA ilimitado
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Relatórios avançados
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Importação ilimitada
                  </li>
                </ul>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                onClick={openCheckout}
              >
                <Crown className="mr-2 h-4 w-4" />
                Assinar por {SUBSCRIPTION_TIERS.pro.price}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>
            Informações básicas da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Data de criação</Label>
            <Input 
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : ''} 
              disabled 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis relacionadas à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos, incluindo:
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="my-4">
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Todas as transações</li>
                  <li>Contas e cartões</li>
                  <li>Dívidas e recebíveis</li>
                  <li>Orçamentos e metas</li>
                  <li>Categorias e tags</li>
                  <li>Histórico de importações</li>
                  <li>Configurações pessoais</li>
                </ul>
                
                <div className="mt-4">
                  <Label htmlFor="password-confirm">
                    Digite sua senha para confirmar:
                  </Label>
                  <Input
                    id="password-confirm"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="mt-2"
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPassword("")}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={loading || !password.trim()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading ? "Excluindo..." : "Excluir Conta Permanentemente"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}