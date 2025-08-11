
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import OFXImporter from "@/components/shared/OFXImporter";

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Importar Transações (OFX)</h1>
            <p className="text-muted-foreground">Faça upload do arquivo OFX e importe suas transações</p>
          </div>
        </div>
        <div className="flex justify-center">
          <OFXImporter />
        </div>
      </div>
    </AppLayout>
  );
};

export default ImportsTransactions;
