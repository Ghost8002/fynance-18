import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import OFXImporter from "@/components/shared/OFXImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Info, CheckCircle, AlertTriangle, Download, Upload, Database, TrendingUp, Shield, Clock } from "lucide-react";
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
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                  <Info className="h-5 w-5" />
                  Como funciona?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-blue-600">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <p>Selecione um arquivo OFX do seu banco</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <p>Escolha a conta de destino para as transações</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <p>Revise e ajuste os dados antes de importar</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <p>Confirme a importação das transações</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Benefícios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-green-600">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Importação rápida e segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Compatível com todos os bancos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Dados processados localmente</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  Importante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-yellow-700">
                <p>• Certifique-se de que o arquivo OFX não está corrompido</p>
                <p>• Verifique se a conta de destino está correta</p>
                <p>• Transações duplicadas serão identificadas automaticamente</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção de ajuda */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
              <Download className="h-6 w-6" />
              Precisa de Ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Como obter arquivo OFX?
                </h4>
                <p className="text-sm text-gray-600">
                  Acesse o internet banking do seu banco e procure por "Exportar Extrato" ou "Download OFX". 
                  A maioria dos bancos oferece essa opção na seção de extratos.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Período recomendado
                </h4>
                <p className="text-sm text-gray-600">
                  Para melhor performance, recomendamos importar extratos de no máximo 3 meses por vez.
                  Você pode repetir o processo para períodos maiores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>;
};
export default ImportsTransactions;