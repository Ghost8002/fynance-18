import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, ChevronDown, X } from "lucide-react";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import type { TransactionFilters } from "@/hooks/useTransactionsPaginated";

interface TransactionFiltersAdvancedProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  categories: any[];
  accounts: any[];
  cards: any[];
}

const TransactionFiltersAdvanced = ({ 
  filters, 
  onFiltersChange, 
  categories, 
  accounts, 
  cards 
}: TransactionFiltersAdvancedProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    // Clear category filter when transaction type changes
    if (key === 'type' && filters.categoryId !== 'all') {
      onFiltersChange({ ...filters, [key]: value, categoryId: 'all' });
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      dateRange: "current-month",
      type: "all",
      categoryId: "all",
      accountId: "all",
      cardId: "all",
      minAmount: "",
      maxAmount: "",
    });
    setLocalDateRange({ from: undefined, to: undefined });
  };

  const hasActiveFilters = 
    filters.search !== "" ||
    filters.dateRange !== "current-month" ||
    filters.type !== "all" ||
    filters.categoryId !== "all" ||
    filters.accountId !== "all" ||
    filters.cardId !== "all" ||
    filters.minAmount !== "" ||
    filters.maxAmount !== "" ||
    localDateRange.from !== undefined ||
    localDateRange.to !== undefined;

  // Filter categories based on selected transaction type
  const filteredCategories = categories.filter(category => {
    if (filters.type === 'income') {
      return category.type === 'income';
    } else if (filters.type === 'expense') {
      return category.type === 'expense';
    }
    return true; // Show all if no type filter
  });

  // Sort categories
  const sortedCategories = filteredCategories.sort((a, b) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    const sortOrderA = a.sort_order || 0;
    const sortOrderB = b.sort_order || 0;
    if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                  Ativo
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Pesquisa */}
            <div className="space-y-2">
              <Label htmlFor="search">Pesquisar</Label>
              <div className="relative">
                <Input 
                  id="search"
                  type="text" 
                  placeholder="Pesquisar transações..." 
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
            </div>

            {/* Filtros de linha 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Período Predefinido */}
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="last-7-days">Últimos 7 dias</SelectItem>
                    <SelectItem value="current-month">Mês atual</SelectItem>
                    <SelectItem value="last-month">Mês passado</SelectItem>
                    <SelectItem value="current-year">Ano atual</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {sortedCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                          {category.is_default && (
                            <span className="text-xs text-muted-foreground">(Padrão)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    {sortedCategories.length === 0 && filters.type !== 'all' && (
                      <SelectItem value="" disabled>
                        {filters.type === 'income' 
                          ? 'Nenhuma categoria de receita'
                          : 'Nenhuma categoria de despesa'
                        }
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros de linha 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conta */}
              <div className="space-y-2">
                <Label>Conta</Label>
                <Select value={filters.accountId} onValueChange={(value) => handleFilterChange('accountId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {account.bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cartão */}
              <div className="space-y-2">
                <Label>Cartão</Label>
                <Select value={filters.cardId} onValueChange={(value) => handleFilterChange('cardId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name} - *{card.last_four_digits}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Valor Mínimo</Label>
                <Input
                  id="minAmount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Valor Máximo</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                />
              </div>
            </div>

            {/* Período Personalizado */}
            <div className="space-y-2">
              <Label>Período Personalizado</Label>
              <DateRangeFilter 
                dateRange={localDateRange} 
                onDateRangeChange={setLocalDateRange}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default TransactionFiltersAdvanced;
