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
import { Trash2 } from "lucide-react";

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
        console.error('Error deleting account:', deleteError);
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
      console.error('Error deleting account:', error);
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