import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface ChartMobileProps {
  title: string;
  data: Array<{ name: string; value: number; color: string }>;
  emptyMessage: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const ChartMobile = ({ title, data, emptyMessage }: ChartMobileProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-center py-6 text-xs text-muted-foreground">
            {emptyMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="h-[160px] mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-1.5">
          {data.slice(0, 3).map((category) => (
            <div key={category.name} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-foreground truncate">{category.name}</span>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 ml-2">
                <span className="font-medium text-foreground">{formatCurrency(category.value)}</span>
                <span className="text-[10px] text-muted-foreground">
                  {total > 0 ? ((category.value / total) * 100).toFixed(0) : '0'}%
                </span>
              </div>
            </div>
          ))}
          {data.length > 3 && (
            <p className="text-[10px] text-muted-foreground pt-1">
              +{data.length - 3} categorias
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartMobile;
