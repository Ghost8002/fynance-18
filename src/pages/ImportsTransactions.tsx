import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import OFXImporter from "@/components/shared/OFXImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Info, CheckCircle, AlertTriangle, Download, Upload, Database, TrendingUp, Shield } from "lucide-react";
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/importacoes")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                Importar Transações (OFX)
              </h1>
              <p className="text-muted-foreground">
                Faça upload do arquivo OFX e importe suas transações de forma segura
              </p>
            </div>
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

        {/* Informações sobre OFX */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card principal de importação */}
          <div className="lg:col-span-2">
            <OFXImporter />
          </div>

          {/* Sidebar com informações */}
          
        </div>

        {/* Seção de ajuda */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          
          
        </Card>
      </div>
    </AppLayout>;
};
export default ImportsTransactions;