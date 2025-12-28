import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/shared/AppLayout";
import SimpleJSONImportComponent from "@/components/shared/SimpleJSONImportComponent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Shield, CheckCircle } from "lucide-react";

const ImportsJSON = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // SEO
    document.title = "Importar do Chat (JSON) | Fynance";
    const desc = "Importe transações financeiras a partir de arquivos JSON gerados pelo ChatGPT.";
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
    link.setAttribute("href", window.location.origin + "/importacoes/json");
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
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Importar do Chat
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Carregue seu arquivo JSON gerado pelo ChatGPT e importe todas as suas transações de forma rápida e automatizada. 
              O sistema valida o formato e associa as transações à conta selecionada.
            </p>
          </div>
        </div>

        {/* Interface de importação JSON */}
        <div className="max-w-6xl mx-auto">
          <SimpleJSONImportComponent />
        </div>
      </div>
    </AppLayout>
  );
};

export default ImportsJSON;
