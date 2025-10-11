import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, FileText, Database, Upload, Download, Settings, TrendingUp, Users, Calendar, CreditCard, Wallet, BarChart3, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
const Imports = () => {
  const {
    isAuthenticated
  } = useAuth();
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
  const importOptions = [{
    id: "transactions",
    title: "Transações OFX",
    description: "Importe extratos bancários no formato OFX",
    icon: FileText,
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    status: "Disponível",
    features: ["Suporte a OFX 1.x e 2.x", "Categorização automática", "Validação de dados"],
    to: "/importacoes/transacoes",
    comingSoon: false
  }, {
    id: "xlsx",
    title: "Transações XLSX",
    description: "Importe dados de planilhas XLSX",
    icon: Receipt,
    color: "bg-gradient-to-br from-green-500 to-green-600",
    status: "Disponível",
    features: ["Formato Excel", "Mapeamento personalizado", "Validação avançada"],
    to: "/importacoes/xlsx",
    comingSoon: false
  }, {
    id: "json",
    title: "Importar do Chat",
    description: "Importe transações via JSON gerado pelo ChatGPT",
    icon: Upload,
    color: "bg-gradient-to-br from-violet-500 to-violet-600",
    status: "Disponível",
    features: ["JSON estruturado", "Validação automática", "Importação rápida"],
    to: "/importacoes/json",
    comingSoon: false
  }, {
    id: "accounts",
    title: "Contas Bancárias",
    description: "Sincronize suas contas bancárias",
    icon: Database,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    status: "Em breve",
    features: ["Sincronização automática", "Múltiplos bancos", "Saldo em tempo real"],
    to: "/importacoes/contas",
    comingSoon: true
  }, {
    id: "cards",
    title: "Cartões de Crédito",
    description: "Importe faturas de cartões",
    icon: CreditCard,
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
    status: "Em breve",
    features: ["Faturas automáticas", "Parcelamentos", "Categorização inteligente"],
    to: "/importacoes/cartoes",
    comingSoon: true
  }, {
    id: "investments",
    title: "Investimentos",
    description: "Importe dados de investimentos",
    icon: TrendingUp,
    color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    status: "Em breve",
    features: ["Múltiplas corretoras", "Rentabilidade", "Relatórios avançados"],
    to: "/importacoes/investimentos",
    comingSoon: true
  }, {
    id: "budgets",
    title: "Orçamentos",
    description: "Importe orçamentos existentes",
    icon: BarChart3,
    color: "bg-gradient-to-br from-pink-500 to-pink-600",
    status: "Em breve",
    features: ["Templates prontos", "Metas personalizadas", "Acompanhamento"],
    to: "/importacoes/orcamentos",
    comingSoon: true
  }];
  if (!isAuthenticated) return null;
  return <AppLayout>
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-finance-text-primary mb-2 text-gradient">
              Importações
            </h1>
            <p className="text-lg text-finance-text-secondary">
              Importe e sincronize seus dados financeiros de forma simples e segura
            </p>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-finance-text-primary">
              Escolha uma Importação
            </h2>
            <p className="text-finance-text-secondary">
              Selecione o tipo de dados que deseja importar para o Fynance
            </p>
          </div>
          
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {importOptions.map((item, index) => <Card key={item.id} className={`cursor-pointer transition-all duration-300 border-gray-200 hover:shadow-xl hover:scale-105 ${item.comingSoon ? 'opacity-60' : 'hover:border-blue-300'}`} onClick={() => !item.comingSoon && navigate(item.to)} style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${item.color} text-white shadow-lg`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <Badge variant={item.comingSoon ? "secondary" : "default"} className="text-xs">
                    {item.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-lg font-semibold text-finance-text-primary">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-finance-text-secondary">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Recursos
                    </p>
                    <ul className="space-y-1">
                      {item.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          {feature}
                        </li>)}
                    </ul>
                  </div>

                  <div className="pt-3 border-t">
                    {item.comingSoon ? <Button variant="outline" className="w-full" disabled>
                        <Clock className="h-4 w-4 mr-2" />
                        Em Breve
                      </Button> : <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" onClick={() => navigate(item.to)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Começar Importação
                      </Button>}
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </AppLayout>;
};
export default Imports;