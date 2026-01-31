import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialPeriod } from "@/hooks/useFinancialPeriod";
import { PeriodType } from "@/components/dashboard/PeriodFilter";
import { useTheme } from "@/hooks/useTheme";
import { devLog } from "@/utils/logger";

// Define category data type
type CategoryData = {
  name: string;
  value: number;
  color: string;
};

type IncomePieChartProps = {
  selectedPeriod?: PeriodType;
  customDateRange?: { from?: Date; to?: Date };
};

const IncomePieChart = ({ selectedPeriod = 'current-month', customDateRange }: IncomePieChartProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { filterTransactionsByPeriod } = useFinancialPeriod();
  const { data: transactions } = useSupabaseData('transactions', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  devLog('IncomePieChart - Transactions:', transactions);
  devLog('IncomePieChart - Categories:', categories);

// Filter transactions by current period and income type
const incomeTx = transactions.filter(t => t.type === 'income');
const filteredTransactions = (selectedPeriod === 'custom' && customDateRange?.from && customDateRange?.to && customDateRange.from <= customDateRange.to)
  ? incomeTx.filter(t => {
      // Criar data local a partir da string para evitar conversão UTC
      const [year, month, day] = t.date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setHours(0, 0, 0, 0);
      return d >= (customDateRange.from as Date) && d <= (customDateRange.to as Date);
    })
  : filterTransactionsByPeriod(incomeTx, selectedPeriod);

  devLog('IncomePieChart - Filtered Transactions:', filteredTransactions);

  // Create category map for lookup
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = { name: cat.name, color: cat.color };
    return acc;
  }, {} as Record<string, { name: string; color: string }>);

  // Group income by category
  const incomeByCategory = filteredTransactions.reduce((acc, transaction) => {
    const categoryId = transaction.category_id;
    if (categoryId && categoryMap[categoryId]) {
      const categoryName = categoryMap[categoryId].name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          value: 0,
          color: categoryMap[categoryId].color,
        };
      }
      acc[categoryName].value += Math.abs(Number(transaction.amount));
    } else {
      // Handle transactions without category
      if (!acc['Sem categoria']) {
        acc['Sem categoria'] = {
          name: 'Sem categoria',
          value: 0,
          color: '#9CA3AF',
        };
      }
      acc['Sem categoria'].value += Math.abs(Number(transaction.amount));
    }
    return acc;
  }, {} as Record<string, CategoryData>);

  const incomeData = (Object.values(incomeByCategory) as CategoryData[]).sort((a, b) => b.value - a.value);
  
  // Calculate total income
  const totalIncome = incomeData.reduce((sum, item) => sum + item.value, 0);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as CategoryData;
      return (
        <div className="bg-card p-3 shadow-md rounded-md border border-border">
          <p className="font-medium text-card-foreground">{data.name}</p>
          <p className="text-muted-foreground">{formatCurrency(data.value)}</p>
          <p className="text-muted-foreground text-sm">
            {totalIncome > 0 ? ((data.value / totalIncome) * 100).toFixed(1) : '0'}% do total
          </p>
        </div>
      );
    }
    return null;
  };
  
  if (incomeData.length === 0) {
    return (
      <Card className="animate-fade-in h-full bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-card-foreground text-base">Receitas por Categoria</CardTitle>
          <CardDescription className="text-xs">Distribuição de receitas</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[160px]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Nenhuma receita no período</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="animate-fade-in h-full bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-card-foreground text-base">Receitas por Categoria</CardTitle>
        <CardDescription className="text-xs">Distribuição de receitas</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-4">
          <div className="h-[140px] w-[140px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={55}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 min-w-0">
            <ul className="space-y-1.5">
              {incomeData.slice(0, 4).map((category) => (
                <li key={category.name} className="flex justify-between items-center">
                  <div className="flex items-center min-w-0">
                    <span
                      className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-card-foreground text-xs truncate">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="font-medium text-card-foreground text-xs">{formatCurrency(category.value)}</span>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">
                      {totalIncome > 0 ? ((category.value / totalIncome) * 100).toFixed(0) : '0'}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {incomeData.length > 4 && (
              <p className="text-[10px] text-muted-foreground mt-2">
                +{incomeData.length - 4} categorias
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomePieChart;
