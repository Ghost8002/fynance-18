import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}
export const DateRangeFilter = ({
  dateRange,
  onDateRangeChange,
  className
}: DateRangeFilterProps) => {
  const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
  const [toCalendarOpen, setToCalendarOpen] = useState(false);
  const handleFromDateSelect = (date: Date | undefined) => {
    const newRange = {
      ...dateRange,
      from: date
    };

    // Se a data inicial for maior que a final, limpar a data final
    if (date && dateRange.to && date > dateRange.to) {
      newRange.to = undefined;
    }
    onDateRangeChange(newRange);
    setFromCalendarOpen(false);
  };
  const handleToDateSelect = (date: Date | undefined) => {
    const newRange = {
      ...dateRange,
      to: date
    };
    onDateRangeChange(newRange);
    setToCalendarOpen(false);
  };
  const clearFilters = () => {
    onDateRangeChange({
      from: undefined,
      to: undefined
    });
  };
  const isValidRange = dateRange.from && dateRange.to && dateRange.from <= dateRange.to;
  return <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Data Inicial */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Data Inicial</Label>
          <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full sm:w-[140px] justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", {
                locale: ptBR
              }) : <span>Selecionar</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateRange.from} onSelect={handleFromDateSelect} disabled={date => date > new Date()} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data Final */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Data Final</Label>
          <Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full sm:w-[140px] justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", {
                locale: ptBR
              }) : <span>Selecionar</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateRange.to} onSelect={handleToDateSelect} disabled={date => {
              const today = new Date();
              const minDate = dateRange.from || new Date(2020, 0, 1);
              return date > today || date < minDate;
            }} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2 sm:items-end">
        {(dateRange.from || dateRange.to) && <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
            Limpar
          </Button>}
      </div>

      {/* Feedback do período selecionado */}
      {isValidRange}

      {/* Validação de período inválido */}
      {dateRange.from && dateRange.to && dateRange.from > dateRange.to && <div className="text-xs text-destructive mt-1 sm:mt-6">
          Data inicial deve ser anterior à data final
        </div>}
    </div>;
};