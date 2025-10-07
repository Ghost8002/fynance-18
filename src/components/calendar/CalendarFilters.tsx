
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarEventType } from "@/hooks/useCalendarEvents";
import { Search, X } from "lucide-react";

interface CalendarFiltersProps {
  eventTypes: CalendarEventType[];
  showOverdue: boolean;
  searchTerm: string;
  onToggleEventType: (type: CalendarEventType) => void;
  onToggleShowOverdue: () => void;
  onSearchChange: (term: string) => void;
  onClearFilters: () => void;
}

const CalendarFilters = ({
  eventTypes,
  showOverdue,
  searchTerm,
  onToggleEventType,
  onToggleShowOverdue,
  onSearchChange,
  onClearFilters
}: CalendarFiltersProps) => {
  const eventTypeLabels = {
    transaction: 'Transações',
    receivable: 'A Receber',
    debt: 'Dívidas'
  };

  const eventTypeColors = {
    transaction: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-800/30',
    receivable: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-800/30',
    debt: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-800/30'
  };

  const hasActiveFilters = searchTerm || eventTypes.length < 3 || !showOverdue;

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      
      <div className="p-4 space-y-4">
        {/* Busca */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium flex items-center gap-2">
            <Search className="h-3 w-3" />
            Buscar eventos
          </Label>
          <div className="relative">
            <Input
              id="search"
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Tipos de evento */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipos de evento</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(eventTypeLabels) as CalendarEventType[]).map((type) => (
              <Badge
                key={type}
                variant={eventTypes.includes(type) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  eventTypes.includes(type) ? eventTypeColors[type] : 'hover:bg-muted'
                }`}
                onClick={() => onToggleEventType(type)}
              >
                {eventTypeLabels[type]}
              </Badge>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarFilters;
