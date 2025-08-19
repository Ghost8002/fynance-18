import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import CSVImporter from "@/components/shared/CSVImporter";
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
  Shield,
  FileSpreadsheet,
  Table,
  Settings
} from "lucide-react";

const ImportsCSV = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
    // SEO
    document.title = "Importar Transações (CSV) | Fynance";
    const desc = "Importe transações financeiras a partir de arquivos CSV.";
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
    link.setAttribute("href", window.location.origin + "/importacoes/csv");
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
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-white" />
                </div>
                Importar Transações (CSV)
              </h1>
              <p className="text-muted-foreground">
                Faça upload do arquivo CSV e importe suas transações de forma flexível
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
              Flexível
            </Badge>
          </div>
        </div>

        {/* Informações sobre CSV */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card principal de importação */}
          <div className="lg:col-span-2">
            <CSVImporter />
          </div>

          {/* Sidebar com informações */}
          <div className="space-y-6">
            {/* Sobre CSV */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Info className="h-5 w-5" />
                  Sobre o Formato CSV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-green-700">
                  CSV (Comma-Separated Values) é um formato de arquivo simples que pode ser criado 
                  em qualquer editor de texto ou planilha.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Compatível com Excel e Google Sheets
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Mapeamento personalizado de colunas
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Múltiplos delimitadores suportados
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Validação avançada de dados
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Como criar CSV */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Table className="h-5 w-5" />
                  Como Criar um Arquivo CSV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Use Excel/Google Sheets</p>
                      <p className="text-xs text-blue-600">Crie uma planilha com suas transações</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Organize as colunas</p>
                      <p className="text-xs text-blue-600">Data, Descrição, Valor, Tipo, etc.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Exporte como CSV</p>
                      <p className="text-xs text-blue-600">Salve com extensão .csv</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Faça upload aqui</p>
                      <p className="text-xs text-blue-600">Mapeie as colunas e importe</p>
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
                    <p>Use o template fornecido como base</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-orange-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    <p>Verifique se as datas estão no formato correto</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-orange-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    <p>Use valores negativos para despesas</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-orange-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    <p>Mapeie corretamente as colunas obrigatórias</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-orange-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    <p>Revise os dados antes de importar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Settings className="h-5 w-5" />
                  Configurações Suportadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="font-medium text-purple-700">Delimitadores:</p>
                    <p className="text-purple-600">Vírgula, Ponto e vírgula, Tabulação</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-purple-700">Decimais:</p>
                    <p className="text-purple-600">Ponto (.) ou Vírgula (,)</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-purple-700">Encoding:</p>
                    <p className="text-purple-600">UTF-8, ISO-8859-1</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-purple-700">Cabeçalho:</p>
                    <p className="text-purple-600">Com ou sem cabeçalho</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-indigo-800">
                  <TrendingUp className="h-5 w-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-lg font-bold text-indigo-600">0</p>
                    <p className="text-xs text-indigo-500">Importações</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-lg font-bold text-indigo-600">0</p>
                    <p className="text-xs text-indigo-500">Transações</p>
                  </div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-lg font-bold text-indigo-600">R$ 0,00</p>
                  <p className="text-xs text-indigo-500">Total Importado</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção de ajuda */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Info className="h-5 w-5 text-green-600" />
              Precisa de Ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Template CSV</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Baixe nosso template para ver o formato correto
                </p>
                <Button variant="outline" size="sm">
                  Baixar Template
                </Button>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                  <Database className="h-6 w-6 text-blue-600" />
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

export default ImportsCSV;
