
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import OFXImporter from "@/components/shared/OFXImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  FileText, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Upload,
  Database,
  TrendingUp,
  Shield
} from "lucide-react";

const ImportsTransactions = () => {
  const { isAuthenticated } = useAuth();
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/importacoes")}
              className="flex items-center gap-2"
            >
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
            {/* Sobre OFX */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Info className="h-5 w-5" />
                  Sobre o Formato OFX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-blue-700">
                  OFX (Open Financial Exchange) é um padrão para troca de dados financeiros 
                  entre aplicações e instituições financeiras.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                    Suporte a OFX 1.x e 2.x
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                    Bancos brasileiros
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                    Categorização automática
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                    Validação de dados
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Como obter OFX */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Download className="h-5 w-5" />
                  Como Obter o Arquivo OFX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Acesse seu banco</p>
                      <p className="text-xs text-green-600">Entre no internet banking</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Exporte o extrato</p>
                      <p className="text-xs text-green-600">Procure por "Exportar OFX"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Faça upload aqui</p>
                      <p className="text-xs text-green-600">Arraste ou selecione o arquivo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dicas */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Dicas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-orange-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    <p>Selecione o período desejado no banco</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-orange-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    <p>Verifique se o arquivo tem extensão .ofx</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-orange-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    <p>Revise as categorias antes de importar</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-orange-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    <p>Mantenha backup dos dados originais</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <TrendingUp className="h-5 w-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-lg font-bold text-purple-600">0</p>
                    <p className="text-xs text-purple-500">Importações</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-lg font-bold text-purple-600">0</p>
                    <p className="text-xs text-purple-500">Transações</p>
                  </div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-lg font-bold text-purple-600">R$ 0,00</p>
                  <p className="text-xs text-purple-500">Total Importado</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção de ajuda */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Info className="h-5 w-5 text-blue-600" />
              Precisa de Ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Documentação</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Guia completo sobre importação OFX
                </p>
                <Button variant="outline" size="sm">
                  Ver Documentação
                </Button>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Suporte</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Nossa equipe está pronta para ajudar
                </p>
                <Button variant="outline" size="sm">
                  Contatar Suporte
                </Button>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Tutorial</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Vídeo explicativo passo a passo
                </p>
                <Button variant="outline" size="sm">
                  Assistir Tutorial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ImportsTransactions;
