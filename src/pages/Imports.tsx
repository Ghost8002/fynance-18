
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Receipt } from "lucide-react";

const Imports = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
    // SEO
    document.title = "Importações | Fynance";
    const desc = "Importe dados financeiros, como transações via OFX.";
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
    link.setAttribute("href", window.location.origin + "/importacoes");
  }, [isAuthenticated, navigate]);

  const importOptions = [
    {
      id: "transactions",
      title: "Transações",
      description: "Importar transações OFX",
      icon: Receipt,
      color: "bg-gradient-to-br from-finance-primary to-finance-secondary",
      to: "/importacoes/transacoes",
    },
  ];

  if (!isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-finance-text-primary mb-2 text-gradient">
          Importações
        </h1>
        <p className="text-lg text-finance-text-secondary">
          Selecione o tipo de dado que deseja importar
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-finance-text-primary">Escolha uma Importação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {importOptions.map((item, index) => (
            <Card
              key={item.id}
              className={`cursor-pointer glass-hover transition-all duration-300 border-gray-200 hover:shadow-xl hover:scale-105`}
              onClick={() => navigate(item.to)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.color} text-white shadow-lg`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-finance-text-primary mb-1">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-finance-text-secondary">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Imports;
