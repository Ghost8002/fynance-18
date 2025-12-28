import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/shared/AppLayout";
import ImprovedOFXImporter from "@/components/shared/ImprovedOFXImporter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, CheckCircle } from "lucide-react";

const ImportsTransactions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // SEO
    document.title = "Importar Transações (OFX) | Fynance";
    const desc = "Importe transações financeiras a partir de arquivos OFX.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/importacoes/transacoes");
  }, []);
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/importacoes")} 
                className="flex items-center gap-2 hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Seguro
              </Badge>
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Validado
              </Badge>
            </div>
          </div>
          
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl mb-6">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Importar Transações OFX
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Carregue seu arquivo OFX e importe todas as suas transações bancárias de forma rápida e segura. 
              Suportamos arquivos de todos os principais bancos brasileiros.
            </p>
          </div>
        </div>

        {/* Interface de importação melhorada */}
        <div className="max-w-6xl mx-auto">
          <ImprovedOFXImporter />
        </div>
      </div>
    </AppLayout>
  );
};
export default ImportsTransactions;