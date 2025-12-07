
import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, PieChart, Calendar as CalendarIcon, TrendingUp, Target, CreditCard, Wallet, Brain, Heart, Star, BarChart, Filter, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import IncomeExpenseReport from "@/components/reports/IncomeExpenseReport";
import CategoryReport from "@/components/reports/CategoryReport";
import MonthlyReport from "@/components/reports/MonthlyReport";
import CashFlowReport from "@/components/reports/CashFlowReport";
import BudgetAnalysisReport from "@/components/reports/BudgetAnalysisReport";
import GoalsProgressReport from "@/components/reports/GoalsProgressReport";
import AccountBalanceReport from "@/components/reports/AccountBalanceReport";
import AdvancedAnalyticsReport from "@/components/reports/AdvancedAnalyticsReport";
import PredictiveAnalysisReport from "@/components/reports/PredictiveAnalysisReport";
import FinancialHealthReport from "@/components/reports/FinancialHealthReport";
import ExecutiveDashboard from "@/components/reports/ExecutiveDashboard";

import CostCentersReport from "@/components/reports/CostCentersReport";

// Contexto para o filtro de período global
interface PeriodFilterContextType {
  period: string;
  setPeriod: (period: string) => void;
  customStartDate: Date | undefined;
  setCustomStartDate: (date: Date | undefined) => void;
  customEndDate: Date | undefined;
  setCustomEndDate: (date: Date | undefined) => void;
}

const PeriodFilterContext = createContext<PeriodFilterContextType | undefined>(undefined);

export const usePeriodFilter = () => {
  const context = useContext(PeriodFilterContext);
  if (!context) {
    throw new Error('usePeriodFilter must be used within a PeriodFilterProvider');
  }
  return context;
};

const Reports = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("executive-dashboard");
  const [globalPeriod, setGlobalPeriod] = useState("current-month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const reportTypes = [
    {
      id: "executive-dashboard",
      title: "Dashboard Executivo",
      description: "Visão geral com KPIs principais",
      icon: Star,
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      priority: "high"
    },
    {
      id: "financial-health",
      title: "Saúde Financeira",
      description: "Score e recomendações personalizadas",
      icon: Heart,
      color: "bg-gradient-to-br from-red-500 to-red-600",
      priority: "high"
    },
    {
      id: "advanced-analytics",
      title: "Análise Avançada",
      description: "Métricas financeiras robustas",
      icon: Brain,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      priority: "high"
    },
    {
      id: "predictive-analysis",
      title: "Análise Preditiva",
      description: "Projeções e cenários futuros",
      icon: BarChart,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      priority: "high"
    },
    {
      id: "income-expense",
      title: "Receitas x Despesas",
      description: "Compare suas receitas e despesas",
      icon: BarChart3,
      color: "bg-gradient-to-br from-finance-primary to-finance-secondary"
    },
    {
      id: "categories",
      title: "Por Categoria",
      description: "Análise por categorias",
      icon: PieChart,
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      id: "monthly",
      title: "Mensal",
      description: "Relatório mensal detalhado",
      icon: CalendarIcon,
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      id: "cash-flow",
      title: "Fluxo de Caixa",
      description: "Movimento de entrada e saída",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      id: "budget-analysis",
      title: "Análise de Orçamento",
      description: "Acompanhamento do orçamento",
      icon: Target,
      color: "bg-gradient-to-br from-red-500 to-red-600"
    },
    {
      id: "goals-progress",
      title: "Progresso de Metas",
      description: "Status das suas metas",
      icon: Target,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600"
    },
    {
      id: "accounts",
      title: "Saldo das Contas",
      description: "Balanço das contas",
      icon: CreditCard,
      color: "bg-gradient-to-br from-teal-500 to-teal-600"
    },

    {
      id: "cost-centers",
      title: "Centros de Custo",
      description: "Gerencie e analise seus centros de custo",
      icon: DollarSign,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600"
    }
  ];

  return (
    <AppLayout>
      {/* Header Section */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col gap-6">
          {/* Title Section */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-finance-text-primary mb-3 text-gradient">
              Relatórios Financeiros
            </h1>
            <p className="text-base md:text-lg text-finance-text-secondary max-w-2xl">
              Análises detalhadas e insights sobre suas finanças
            </p>
          </div>
          
          {/* Filter Section */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-finance-primary/10 rounded-lg">
                  <Filter className="h-5 w-5 text-finance-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-finance-text-primary">Filtro de Período</h3>
                  <p className="text-sm text-finance-text-secondary">Selecione o período para análise</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-finance-text-secondary whitespace-nowrap">Período:</span>
                  <Select value={globalPeriod} onValueChange={(value) => {
                    setGlobalPeriod(value);
                    // Limpar datas personalizadas quando mudar para período predefinido
                    if (value !== "custom") {
                      setCustomStartDate(undefined);
                      setCustomEndDate(undefined);
                    }
                  }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Selecione um período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Mês Atual</SelectItem>
                      <SelectItem value="last-month">Mês Anterior</SelectItem>
                      <SelectItem value="last-3-months">Últimos 3 Meses</SelectItem>
                      <SelectItem value="last-6-months">Últimos 6 Meses</SelectItem>
                      <SelectItem value="last-12-months">Últimos 12 Meses</SelectItem>
                      <SelectItem value="current-year">Ano Atual</SelectItem>
                      <SelectItem value="last-year">Ano Anterior</SelectItem>
                      <SelectItem value="custom">Período Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Custom Date Pickers */}
            {globalPeriod === "custom" && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-finance-text-primary">Data Inicial</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-10"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customStartDate}
                            onSelect={setCustomStartDate}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-finance-text-primary">Data Final</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-10"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customEndDate}
                            onSelect={setCustomEndDate}
                            initialFocus
                            locale={ptBR}
                            disabled={(date) => customStartDate ? date < customStartDate : false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {customStartDate && customEndDate && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-finance-primary/5 rounded-lg border border-finance-primary/20">
                      <CalendarIcon className="h-4 w-4 text-finance-primary" />
                      <span className="text-sm font-medium text-finance-text-primary">
                        Período: {format(customStartDate, "dd/MM/yyyy", { locale: ptBR })} - {format(customEndDate, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-scale-in">
        {/* Reports Selection Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-finance-text-primary mb-2">
              Escolha seu Relatório
            </h2>
            <p className="text-finance-text-secondary max-w-2xl mx-auto">
              Selecione o tipo de análise que melhor atende às suas necessidades
            </p>
          </div>
          
          {/* Relatórios Principais */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-finance-text-primary">Relatórios Principais</h3>
                <p className="text-sm text-finance-text-secondary">Análises essenciais para gestão financeira</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reportTypes.filter(report => report.priority === "high").map((report, index) => (
                <Card 
                  key={report.id} 
                  className={`group cursor-pointer transition-all duration-300 border-2 hover:border-finance-primary/30
                    ${activeTab === report.id 
                      ? 'border-finance-primary shadow-xl scale-105 bg-finance-primary/5' 
                      : 'border-border hover:shadow-lg hover:scale-102'}`}
                  onClick={() => setActiveTab(report.id)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${report.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <report.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold text-finance-text-primary mb-1 truncate">
                          {report.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-finance-text-secondary line-clamp-2">
                          {report.description}
                        </CardDescription>
                      </div>
                    </div>
                    {activeTab === report.id && (
                      <div className="mt-3 w-full h-1 bg-finance-primary rounded-full"></div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Outros Relatórios */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-finance-text-primary">Relatórios Detalhados</h3>
                <p className="text-sm text-finance-text-secondary">Análises específicas e complementares</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reportTypes.filter(report => !report.priority).map((report, index) => (
                <Card 
                  key={report.id} 
                  className={`group cursor-pointer transition-all duration-300 border-2 hover:border-finance-primary/30
                    ${activeTab === report.id 
                      ? 'border-finance-primary shadow-xl scale-105 bg-finance-primary/5' 
                      : 'border-border hover:shadow-lg hover:scale-102'}`}
                  onClick={() => setActiveTab(report.id)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${report.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <report.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold text-finance-text-primary mb-1 truncate">
                          {report.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-finance-text-secondary line-clamp-2">
                          {report.description}
                        </CardDescription>
                      </div>
                    </div>
                    {activeTab === report.id && (
                      <div className="mt-3 w-full h-1 bg-finance-primary rounded-full"></div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        
        {/* Active Report Indicator */}
        {activeTab && (
          <div className="mb-6 p-4 bg-gradient-to-r from-finance-primary/10 to-finance-secondary/10 rounded-xl border border-finance-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-finance-primary/20 rounded-lg flex-shrink-0">
                {(() => {
                  const activeReport = reportTypes.find(r => r.id === activeTab);
                  const IconComponent = activeReport?.icon || BarChart3;
                  return <IconComponent className="h-5 w-5 text-finance-primary" />;
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-finance-text-primary truncate">
                  {reportTypes.find(r => r.id === activeTab)?.title || 'Relatório'}
                </h3>
                <p className="text-sm text-finance-text-secondary line-clamp-2">
                  {reportTypes.find(r => r.id === activeTab)?.description || 'Visualizando relatório selecionado'}
                </p>
              </div>
            </div>
          </div>
        )}

        <PeriodFilterContext.Provider value={{ 
          period: globalPeriod, 
          setPeriod: setGlobalPeriod,
          customStartDate,
          setCustomStartDate,
          customEndDate,
          setCustomEndDate
        }}>
          <div className="animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[400px]">
              <TabsContent value="executive-dashboard" className="p-0">
                <div className="p-6">
                  <ExecutiveDashboard />
                </div>
              </TabsContent>
              
              <TabsContent value="financial-health" className="p-0">
                <div className="p-6">
                  <FinancialHealthReport />
                </div>
              </TabsContent>
              
              <TabsContent value="advanced-analytics" className="p-0">
                <div className="p-6">
                  <AdvancedAnalyticsReport />
                </div>
              </TabsContent>
              
              <TabsContent value="predictive-analysis" className="p-0">
                <div className="p-6">
                  <PredictiveAnalysisReport />
                </div>
              </TabsContent>
              
              <TabsContent value="income-expense" className="p-0">
                <div className="p-6">
                  <IncomeExpenseReport />
                </div>
              </TabsContent>
              
              <TabsContent value="categories" className="p-0">
                <div className="p-6">
                  <CategoryReport />
                </div>
              </TabsContent>
              
              <TabsContent value="monthly" className="p-0">
                <div className="p-6">
                  <MonthlyReport />
                </div>
              </TabsContent>
              
              <TabsContent value="cash-flow" className="p-0">
                <div className="p-6">
                  <CashFlowReport />
                </div>
              </TabsContent>
              
              <TabsContent value="budget-analysis" className="p-0">
                <div className="p-6">
                  <BudgetAnalysisReport />
                </div>
              </TabsContent>
              
              <TabsContent value="goals-progress" className="p-0">
                <div className="p-6">
                  <GoalsProgressReport />
                </div>
              </TabsContent>
              
              <TabsContent value="accounts" className="p-0">
                <div className="p-6">
                  <AccountBalanceReport />
                </div>
              </TabsContent>
              

              
              <TabsContent value="cost-centers" className="p-0">
                <div className="p-6">
                  <CostCentersReport />
                </div>
              </TabsContent>
            </div>
          </div>
        </PeriodFilterContext.Provider>
      </Tabs>
    </AppLayout>
  );
};

export default Reports;
