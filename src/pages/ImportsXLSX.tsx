import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import SimpleXLSXImporter from "@/components/shared/SimpleXLSXImporter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
const ImportsXLSX = () => {
  const {
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
    // SEO
    document.title = "Importar Transações (XLSX) | Fynance";
    const desc = "Importe transações financeiras a partir de arquivos XLSX.";
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
    link.setAttribute("href", window.location.origin + "/importacoes/xlsx");
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  return <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/importacoes")} className="flex items-center gap-2 hover:bg-muted/50">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
            
            
          </div>
          
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl mb-6">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Importar Transações XLSX
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Carregue seu arquivo XLSX com as colunas obrigatórias (Data, Descrição, Valor, Tipo, Categoria, Tags) 
              e importe todas as suas transações financeiras de forma simples e rápida. 
              O sistema valida automaticamente o formato e permite pré-visualizar os dados antes da importação.
            </p>
          </div>
        </div>

        {/* Interface de importação XLSX simplificada */}
        <div className="max-w-6xl mx-auto">
          <SimpleXLSXImporter />
        </div>
      </div>
    </AppLayout>;
};
export default ImportsXLSX;