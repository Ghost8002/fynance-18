
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDashboardCustomization } from "@/hooks/useDashboardCustomization";
import { 
  Eye, 
  EyeOff, 
  Settings, 
  BarChart3, 
  PieChart, 
  Target, 
  CreditCard, 
  TrendingUp,
  Calendar,
  DollarSign,
  Save,
  RotateCcw,
  Wallet,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DashboardCustomization = () => {
  const { widgets, toggleWidget, visibleWidgets, resetToDefault } = useDashboardCustomization();
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const handleToggleWidget = (id: string) => {
    toggleWidget(id);
    setHasChanges(true);
    
    // Show toast feedback
    const widget = widgets.find(w => w.id === id);
    const newState = !widget?.visible;
    
    toast({
      title: newState ? "Widget habilitado" : "Widget desabilitado",
      description: `${widget?.name} foi ${newState ? 'habilitado' : 'desabilitado'} no dashboard.`,
      duration: 2000,
    });
    
    // Auto-hide the "changes saved" indicator after a delay
    setTimeout(() => setHasChanges(false), 3000);
  };

  const handleResetToDefault = () => {
    resetToDefault();
    toast({
      title: "Configurações restauradas",
      description: "Todas as configurações do dashboard foram restauradas para o padrão.",
      duration: 3000,
    });
  };

  const getWidgetIcon = (id: string) => {
    const iconMap = {
      'financial-summary': DollarSign,
      'expense-chart': PieChart,
      'income-chart': BarChart3,
      'budget-progress': Target,
      'recent-transactions': Calendar,
      'goal-tracker': TrendingUp,
      'card-overview': CreditCard,
      'credit-limit': Wallet,
      'budgets': Target,
      'goals': CheckCircle,
      'transactions': Calendar
    };
    return iconMap[id as keyof typeof iconMap] || BarChart3;
  };

  const getWidgetDescription = (id: string) => {
    const descriptionMap = {
      'financial-summary': 'Resumo completo com receitas, despesas, saldo e informações financeiras principais',
      'expense-chart': 'Gráfico de pizza mostrando a distribuição das suas despesas por categoria',
      'income-chart': 'Gráfico de pizza mostrando a distribuição das suas receitas por categoria',
      'budget-progress': 'Progresso dos seus orçamentos mensais e alertas de gastos',
      'recent-transactions': 'Lista das transações mais recentes com filtros e pesquisa',
      'goal-tracker': 'Acompanhamento do progresso das suas metas financeiras',
      'card-overview': 'Visão geral dos cartões de crédito, limites e utilização',
      'credit-limit': 'Widget específico mostrando o limite de crédito disponível',
      'budgets': 'Widget específico mostrando informações dos orçamentos',
      'goals': 'Widget específico mostrando o progresso das metas',
      'transactions': 'Widget específico mostrando as transações do mês'
    };
    return descriptionMap[id as keyof typeof descriptionMap] || 'Widget do dashboard';
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <div>
                <CardTitle>Personalização do Dashboard</CardTitle>
                <CardDescription>
                  Configure quais widgets deseja exibir no seu dashboard principal
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetToDefault}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrão
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Widgets Visíveis</p>
              <p className="text-sm text-muted-foreground">
                {visibleWidgets.length} de {widgets.length} widgets habilitados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                {visibleWidgets.length}/{widgets.length}
              </Badge>
              {hasChanges && (
                <Badge variant="default" className="gap-1">
                  <Save className="h-3 w-3" />
                  Salvo
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Widgets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Widgets Disponíveis</CardTitle>
          <CardDescription>
            Ative ou desative os widgets que deseja ver no dashboard. As alterações são aplicadas imediatamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {widgets.map((widget) => {
              const IconComponent = getWidgetIcon(widget.id);
              const isSpecificWidget = ['credit-limit', 'budgets', 'goals', 'transactions'].includes(widget.id);
              
              return (
                <div 
                  key={widget.id} 
                  className={`flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                    isSpecificWidget ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${widget.visible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label 
                        htmlFor={widget.id}
                        className="text-sm font-medium cursor-pointer block"
                      >
                        {widget.name}
                        {isSpecificWidget && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Específico
                          </Badge>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {getWidgetDescription(widget.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Posição: {widget.order}º
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    {widget.visible ? (
                      <Badge variant="default" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Visível
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Oculto
                      </Badge>
                    )}
                    
                    <Switch
                      id={widget.id}
                      checked={widget.visible}
                      onCheckedChange={() => handleToggleWidget(widget.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              💡 As alterações são salvas automaticamente e aplicadas imediatamente no dashboard
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Visualização Prévia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visualização Prévia</CardTitle>
          <CardDescription>
            Assim será a ordem dos widgets no seu dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleWidgets.map((widget, index) => {
              const IconComponent = getWidgetIcon(widget.id);
              const isSpecificWidget = ['credit-limit', 'budgets', 'goals', 'transactions'].includes(widget.id);
              
              return (
                <div 
                  key={widget.id}
                  className={`p-3 border rounded-lg bg-muted/30 flex items-center gap-2 ${
                    isSpecificWidget ? 'border-blue-200 bg-blue-100/50 dark:border-blue-800 dark:bg-blue-950/30' : ''
                  }`}
                >
                  <IconComponent className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate flex-1">
                    {widget.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                </div>
              );
            })}
          </div>
          
          {visibleWidgets.length === 0 && (
            <div className="text-center py-8">
              <EyeOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Nenhum widget selecionado para exibição
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Ative pelo menos um widget acima para ver conteúdo no dashboard
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
