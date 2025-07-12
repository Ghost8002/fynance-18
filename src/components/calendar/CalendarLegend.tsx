
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CalendarLegend = () => {
  const legendItems = [
    { color: '#10B981', label: 'Receitas', type: 'income' },
    { color: '#EF4444', label: 'Despesas', type: 'expense' },
    { color: '#3B82F6', label: 'A Receber', type: 'receivable' },
    { color: '#F97316', label: 'Dívidas', type: 'debt' },
    { color: '#9CA3AF', label: 'Vencidos', type: 'overdue' }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Legenda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {legendItems.map((item) => (
            <div key={item.type} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarLegend;
