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

type ExpensePieChartProps = { selectedPeriod?: PeriodType; customDateRange?: { from?: Date; to?: Date } };

const ExpensePieChart = ({ selectedPeriod = 'current-month', customDateRange }: ExpensePieChartProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { filterTransactionsByPeriod } = useFinancialPeriod();
  const { data: transactions } = useSupabaseData('transactions', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  devLog('ExpensePieChart - Transactions:', transactions);
  devLog('ExpensePieChart - Categories:', categories);

// Filter transactions by current period and expense type
const expenseTx = transactions.filter(t => t.type === 'expense');
const filteredTransactions = (selectedPeriod === 'custom' && customDateRange?.from && customDateRange?.to && customDateRange.from <= customDateRange.to)
  ? expenseTx.filter(t => {
      // Criar data local a partir da string para evitar conversão UTC
      const [year, month, day] = t.date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setHours(0, 0, 0, 0);
      return d >= (customDateRange.from as Date) && d <= (customDateRange.to as Date);
    })
  : filterTransactionsByPeriod(expenseTx, selectedPeriod);

  devLog('ExpensePieChart - Filtered Transactions:', filteredTransactions);

  // Create category map for lookup
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = { name: cat.name, color: cat.color };
    return acc;
  }, {} as Record<string, { name: string; color: string }>);

  // Group expenses by category
  const expensesByCategory = filteredTransactions.reduce((acc, transaction) => {
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

  const expenseData = (Object.values(expensesByCategory) as CategoryData[]).sort((a, b) => b.value - a.value);
  
  // Calculate total expenses
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);
  
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
            {totalExpenses > 0 ? ((data.value / totalExpenses) * 100).toFixed(1) : '0'}% do total
          </p>
        </div>
      );
    }
    return null;
  };
  
  if (expenseData.length === 0) {
    return (
      <Card className="animate-fade-in h-full bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-card-foreground">Despesas por Categoria</CardTitle>
          <CardDescription>Distribuição dos seus gastos no período</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center text-muted-foreground">
            <p>Nenhuma despesa encontrada para este período</p>
            <p className="text-sm mt-2">Adicione transações para ver o gráfico</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="animate-fade-in h-full bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-card-foreground">Despesas por Categoria</CardTitle>
        <CardDescription>Distribuição dos seus gastos no período</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  color: isDark ? 'hsl(248 250 252)' : 'hsl(31 41 55)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2 text-card-foreground">Resumo de despesas</h4>
          <ul className="space-y-2">
            {expenseData.slice(0, 5).map((category) => (
              <li key={category.name} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-card-foreground text-sm">{category.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-medium text-card-foreground text-sm">{formatCurrency(category.value)}</span>
                  <span className="text-xs text-muted-foreground">
                    {totalExpenses > 0 ? ((category.value / totalExpenses) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {expenseData.length > 5 && (
            <p className="text-xs text-muted-foreground mt-2">
              E mais {expenseData.length - 5} categorias...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensePieChart;
