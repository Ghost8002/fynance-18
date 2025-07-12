
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Target, CreditCard, PiggyBank, TrendingUp, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TransactionForm from "@/components/shared/TransactionForm";

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Importar OFX",
      icon: FileText,
      onClick: () => navigate('/transacoes?tab=importar'),
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      label: "Nova Meta",
      icon: Target,
      onClick: () => navigate('/metas'),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      label: "Novo Cartão",
      icon: CreditCard,
      onClick: () => navigate('/cartoes'),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      label: "Nova Conta",
      icon: PiggyBank,
      onClick: () => navigate('/contas'),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      label: "Relatórios",
      icon: TrendingUp,
      onClick: () => navigate('/relatorios'),
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          <CardTitle className="text-sm">Ações Rápidas</CardTitle>
        </div>
        <CardDescription className="text-xs">Acesso rápido às funcionalidades</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <TransactionForm />
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="w-full justify-start h-8 text-xs"
            >
              <action.icon className="h-3 w-3 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
