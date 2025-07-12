
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarEventType } from "@/hooks/useCalendarEvents";
import { Filter, Search, X } from "lucide-react";

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
    transaction: 'bg-green-100 text-green-800 hover:bg-green-200',
    receivable: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    debt: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
  };

  const hasActiveFilters = searchTerm || eventTypes.length < 3 || !showOverdue;

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filtros</h3>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Ativo
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="h-8 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        </div>
      </div>
      
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

        {/* Configurações adicionais */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-overdue" className="text-sm cursor-pointer">
              Mostrar eventos vencidos
            </Label>
            <Switch
              id="show-overdue"
              checked={showOverdue}
              onCheckedChange={onToggleShowOverdue}
            />
          </div>
        </div>

        {/* Indicador de resultados */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Filtros ativos: {[
                searchTerm && 'busca',
                eventTypes.length < 3 && 'tipos',
                !showOverdue && 'vencidos ocultos'
              ].filter(Boolean).join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarFilters;
