
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart, Calendar, TrendingUp, Target, CreditCard, Wallet, Tags } from "lucide-react";
import IncomeExpenseReport from "@/components/reports/IncomeExpenseReport";
import CategoryReport from "@/components/reports/CategoryReport";
import MonthlyReport from "@/components/reports/MonthlyReport";
import CashFlowReport from "@/components/reports/CashFlowReport";
import BudgetAnalysisReport from "@/components/reports/BudgetAnalysisReport";
import GoalsProgressReport from "@/components/reports/GoalsProgressReport";
import AccountBalanceReport from "@/components/reports/AccountBalanceReport";
import TrendAnalysisReport from "@/components/reports/TrendAnalysisReport";
import TagsOverview from "@/components/tags/TagsOverview";
import TagsIncomeExpenseChart from "@/components/tags/TagsIncomeExpenseChart";
import TagsTransactionsList from "@/components/tags/TagsTransactionsList";
import TagsStatsCards from "@/components/tags/TagsStatsCards";
import CategoriesTagsAnalysis from "@/components/tags/CategoriesTagsAnalysis";

const Reports = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("income-expense");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const reportTypes = [
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
      icon: Calendar,
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
      id: "trends",
      title: "Análise de Tendências",
      description: "Tendências financeiras",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-pink-500 to-pink-600"
    },
    {
      id: "tags",
      title: "Dashboard de Tags",
      description: "Análise por tags",
      icon: Tags,
      color: "bg-gradient-to-br from-cyan-500 to-cyan-600"
    }
  ];

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-finance-text-primary mb-2 text-gradient">
          Relatórios Financeiros
        </h1>
        <p className="text-lg text-finance-text-secondary">
          Análises detalhadas e insights sobre suas finanças
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-scale-in">
        {/* Grid de botões organizados */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6 text-finance-text-primary">Selecione um Relatório</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((report, index) => (
              <Card 
                key={report.id} 
                className={`cursor-pointer glass-hover transition-all duration-300 border-gray-200
                  ${activeTab === report.id ? 'ring-2 ring-finance-primary shadow-lg scale-105' : 'hover:shadow-xl hover:scale-105'}`}
                onClick={() => setActiveTab(report.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${report.color} text-white shadow-lg`}>
                      <report.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold text-finance-text-primary mb-1">
                        {report.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-finance-text-secondary">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Lista de abas tradicional para backup */}
        <TabsList className="hidden">
          <TabsTrigger value="income-expense">Receitas x Despesas</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="cash-flow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="budget-analysis">Análise de Orçamento</TabsTrigger>
          <TabsTrigger value="goals-progress">Progresso de Metas</TabsTrigger>
          <TabsTrigger value="accounts">Saldo das Contas</TabsTrigger>
          <TabsTrigger value="trends">Análise de Tendências</TabsTrigger>
          <TabsTrigger value="tags">Dashboard de Tags</TabsTrigger>
        </TabsList>
        
        <div className="animate-fade-in">
          <TabsContent value="income-expense">
            <IncomeExpenseReport />
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoryReport />
          </TabsContent>
          
          <TabsContent value="monthly">
            <MonthlyReport />
          </TabsContent>
          
          <TabsContent value="cash-flow">
            <CashFlowReport />
          </TabsContent>
          
          <TabsContent value="budget-analysis">
            <BudgetAnalysisReport />
          </TabsContent>
          
          <TabsContent value="goals-progress">
            <GoalsProgressReport />
          </TabsContent>
          
          <TabsContent value="accounts">
            <AccountBalanceReport />
          </TabsContent>
          
          <TabsContent value="trends">
            <TrendAnalysisReport />
          </TabsContent>
          
          <TabsContent value="tags">
            <div className="space-y-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-finance-text-primary mb-2 text-gradient">
                  Dashboard de Tags
                </h2>
                <p className="text-finance-text-secondary">
                  Visualize suas receitas e despesas organizadas por tags e categorias
                </p>
              </div>
              <TagsStatsCards />
              <CategoriesTagsAnalysis />
              <TagsOverview />
              <TagsIncomeExpenseChart />
              <TagsTransactionsList />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </AppLayout>
  );
};

export default Reports;
