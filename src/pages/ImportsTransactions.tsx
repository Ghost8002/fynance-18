import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import OFXImporter from "@/components/shared/OFXImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Upload, Shield, CheckCircle } from "lucide-react";
const ImportsTransactions = () => {
  const {
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
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
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  return <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/importacoes")} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                <Shield className="h-3 w-3 mr-1" />
                Seguro
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                <CheckCircle className="h-3 w-3 mr-1" />
                Validado
              </Badge>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Importar Transações OFX
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Carregue seu arquivo OFX e importe todas as suas transações bancárias de forma rápida e segura
            </p>
          </div>
        </div>

        {/* Interface de importação */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                Carregar Arquivo OFX
              </CardTitle>
              <p className="text-muted-foreground">
                Selecione o arquivo OFX exportado do seu banco para importar as transações
              </p>
            </CardHeader>
            <CardContent>
              <OFXImporter />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>;
};
export default ImportsTransactions;