import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, X, RotateCcw, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface FilterConfig {
  searchTerm: string;
  status: string;
  categoryId: string;
  accountId: string;
  minAmount: string;
  maxAmount: string;
  isRecurring: string;
  priority: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  tags: string[];
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterConfig;
}

interface AdvancedFiltersProps {
  filters: FilterConfig;
  onFiltersChange: (filters: FilterConfig) => void;
  categories?: Array<{ id: string; name: string; type: string }>;
  accounts?: Array<{ id: string; name: string; type: string }>;
  tags?: Array<{ id: string; name: string }>;
  presets?: FilterPreset[];
  onSavePreset?: (preset: FilterPreset) => void;
  onLoadPreset?: (presetId: string) => void;
  type: 'receivables' | 'debts';
  className?: string;
}

const defaultFilters: FilterConfig = {
  searchTerm: '',
  status: 'all',
  categoryId: 'all',
  accountId: 'all',
  minAmount: '',
  maxAmount: '',
  isRecurring: 'all',
  priority: 'all',
  startDate: undefined,
  endDate: undefined,
  tags: [],
};

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  categories = [],
  accounts = [],
  tags = [],
  presets = [],
  onSavePreset,
  onLoadPreset,
  type,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterConfig>(filters);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterConfig, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = { ...defaultFilters };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const hasActiveFilters = () => {
    return Object.entries(localFilters).some(([key, value]) => {
      if (key === 'startDate' || key === 'endDate') return value !== undefined;
      if (key === 'tags') return Array.isArray(value) && value.length > 0;
      return value !== '' && value !== 'all';
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    Object.entries(localFilters).forEach(([key, value]) => {
      if (key === 'startDate' || key === 'endDate') {
        if (value !== undefined) count++;
      } else if (key === 'tags') {
        if (Array.isArray(value) && value.length > 0) count++;
      } else if (value !== '' && value !== 'all') {
        count++;
      }
    });
    return count;
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      const newPreset: FilterPreset = {
        id: Date.now().toString(),
        name: presetName.trim(),
        filters: localFilters
      };
      onSavePreset(newPreset);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset && onLoadPreset) {
      onLoadPreset(presetId);
    }
  };

  const filteredCategories = categories.filter(cat => 
    type === 'receivables' ? cat.type === 'income' : cat.type === 'expense'
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Header clicável para expandir/recolher */}
      <div 
        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border border-border/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm text-foreground">
            Filtros {hasActiveFilters() && `(${getActiveFiltersCount()} ativo${getActiveFiltersCount() !== 1 ? 's' : ''})`}
          </span>
          {hasActiveFilters() && (
            <Badge variant="secondary" className="text-xs">
              {getActiveFiltersCount()} ativo{getActiveFiltersCount() !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              className="h-7 px-3 text-xs hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Filtros expansíveis */}
      {isExpanded && (
        <Card className="mt-3">
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Filtros Básicos */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Filtros Básicos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Busca */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Buscar</label>
                  <Input
                    placeholder="Descrição, tags..."
                    value={localFilters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select value={localFilters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">{type === 'receivables' ? 'Recebido' : 'Pago'}</SelectItem>
                      <SelectItem value="overdue">Em atraso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Categoria</label>
                  <Select value={localFilters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conta */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Conta</label>
                  <Select value={localFilters.accountId} onValueChange={(value) => handleFilterChange('accountId', value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas as contas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as contas</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Filtros Avançados */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Filtros Avançados</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Faixa de Valores */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Valor Mínimo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={localFilters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Valor Máximo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={localFilters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Recorrência */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Recorrência</label>
                  <Select value={localFilters.isRecurring} onValueChange={(value) => handleFilterChange('isRecurring', value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="true">Recorrentes</SelectItem>
                      <SelectItem value="false">Únicas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Prioridade</label>
                  <Select value={localFilters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Início */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start text-left font-normal",
                          !localFilters.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.startDate ? format(localFilters.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.startDate}
                        onSelect={(date) => handleFilterChange('startDate', date)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Data Fim */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data Fim</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start text-left font-normal",
                          !localFilters.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.endDate ? format(localFilters.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.endDate}
                        onSelect={(date) => handleFilterChange('endDate', date)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Presets de Filtros */}
            {presets.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground border-b pb-2">Filtros Salvos</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSavePreset(!showSavePreset)}
                      className="h-8 px-3"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Salvar Atual
                    </Button>
                  </div>
                  
                  {showSavePreset && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome do filtro"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleSavePreset} disabled={!presetName.trim()}>
                        Salvar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowSavePreset(false)}>
                        Cancelar
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {presets.map((preset) => (
                      <Badge
                        key={preset.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1"
                        onClick={() => handleLoadPreset(preset.id)}
                      >
                        {preset.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
