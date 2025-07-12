
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PeriodFilter, PeriodType } from "@/components/dashboard/PeriodFilter";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { Filter } from "lucide-react";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DashboardFiltersProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export const DashboardFilters = ({ 
  selectedPeriod, 
  onPeriodChange, 
  dateRange, 
  onDateRangeChange 
}: DashboardFiltersProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filtros do Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Filtro por Período Predefinido */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Período Predefinido</Label>
            <PeriodFilter value={selectedPeriod} onChange={onPeriodChange} />
          </div>

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Filtro por Período Personalizado */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Período Personalizado</Label>
            <DateRangeFilter 
              dateRange={dateRange} 
              onDateRangeChange={onDateRangeChange}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
