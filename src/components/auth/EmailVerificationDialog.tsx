import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export const EmailVerificationDialog = ({ open, onOpenChange, email }: EmailVerificationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Verifique seu email
          </DialogTitle>
          <DialogDescription className="text-base">
            Enviamos um link de confirmação para:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="font-semibold text-foreground break-all">{email}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Clique no link do email para ativar sua conta
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Verifique a caixa de spam se não encontrar o email
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                O link expira em 24 horas
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full h-12 text-base font-semibold"
            >
              Entendi
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Não recebeu o email?{" "}
            <button className="text-primary hover:underline font-medium">
              Reenviar
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
