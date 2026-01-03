import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { FynanceLogo } from './FynanceLogo';
import { Download } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

const InstallPWAButton = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSDialog, setShowIOSDialog] = useState(false);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSDialog(true);
      return;
    }
    await promptInstall();
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInstall}
              className="h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-300"
            >
              <Download className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Instalar App</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Instalar Fynance</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FynanceLogo size="sm" className="h-6 w-6" />
              Instalar Fynance
            </DialogTitle>
            <DialogDescription>
              Para instalar o Fynance no seu iPhone ou iPad:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                1
              </div>
              <p className="text-sm text-muted-foreground pt-1">
                Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta) na barra do Safari
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                2
              </div>
              <p className="text-sm text-muted-foreground pt-1">
                Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                3
              </div>
              <p className="text-sm text-muted-foreground pt-1">
                Toque em <strong>"Adicionar"</strong> no canto superior direito
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallPWAButton;
