import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInvestments } from '@/hooks/useInvestments';
import { InvestmentSummary } from '@/components/investments/InvestmentSummary';
import { InvestmentsList } from '@/components/investments/InvestmentsList';
import { PortfolioDistributionChart } from '@/components/investments/charts/PortfolioDistributionChart';
import {
  CompoundInterestCalculator,
  FinancialIndependenceCalculator,
  InvestmentComparisonCalculator,
  MonthlyContributionCalculator
} from '@/components/investments/calculators';
import { Briefcase, Calculator, PieChart } from 'lucide-react';

export default function Investments() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const {
    investments,
    loading,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    createTransaction,
    totalInvested,
    totalCurrentValue,
    totalProfit,
    totalProfitPercent,
    investmentsByType
  } = useInvestments();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investimentos</h1>
          <p className="text-muted-foreground">
            Gerencie sua carteira de investimentos e simule cenários
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Carteira</span>
            </TabsTrigger>
            <TabsTrigger value="calculators" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Calculadoras</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Análises</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6 mt-6">
            <InvestmentSummary
              totalInvested={totalInvested}
              totalCurrentValue={totalCurrentValue}
              totalProfit={totalProfit}
              totalProfitPercent={totalProfitPercent}
            />
            
            <InvestmentsList
              investments={investments}
              loading={loading}
              onCreateInvestment={createInvestment}
              onUpdateInvestment={updateInvestment}
              onDeleteInvestment={deleteInvestment}
              onCreateTransaction={createTransaction}
            />
          </TabsContent>

          <TabsContent value="calculators" className="space-y-6 mt-6">
            <CompoundInterestCalculator />
            <FinancialIndependenceCalculator />
            <InvestmentComparisonCalculator />
            <MonthlyContributionCalculator />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortfolioDistributionChart investmentsByType={investmentsByType} />
              
              <InvestmentSummary
                totalInvested={totalInvested}
                totalCurrentValue={totalCurrentValue}
                totalProfit={totalProfit}
                totalProfitPercent={totalProfitPercent}
              />
            </div>
            
            {investments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Adicione investimentos para ver as análises da sua carteira</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
