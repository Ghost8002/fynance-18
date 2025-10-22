import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, Filter, X } from "lucide-react";
import type { TransactionFilters } from "@/hooks/useTransactionsPaginated";

interface TransactionFiltersAdvancedMobileProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  categories: any[];
  accounts: any[];
  cards: any[];
}

const TransactionFiltersAdvancedMobile = ({ 
  filters, 
  onFiltersChange, 
  categories, 
  accounts, 
  cards 
}: TransactionFiltersAdvancedMobileProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    if (key === 'type' && filters.categoryId !== 'all') {
      onFiltersChange({ ...filters, [key]: value as any, categoryId: 'all' });
    } else {
      onFiltersChange({ ...filters, [key]: value as any });
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
    setIsOpen(false);
  };

  const hasActiveFilters = 
    filters.search !== "" ||
    filters.dateRange !== "current-month" ||
    filters.type !== "all" ||
    filters.categoryId !== "all" ||
    filters.accountId !== "all" ||
    filters.cardId !== "all" ||
    filters.minAmount !== "" ||
    filters.maxAmount !== "";

  const filteredCategories = categories.filter(category => {
    if (filters.type === 'income') return category.type === 'income';
    if (filters.type === 'expense') return category.type === 'expense';
    return true;
  }).sort((a, b) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    const sortOrderA = a.sort_order || 0;
    const sortOrderB = b.sort_order || 0;
    if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-2">
      {/* Search bar always visible */}
      <div className="relative">
        <Input 
          type="text" 
          placeholder="Pesquisar..." 
          className="pl-8 h-9 text-sm"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-2">
        <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
          <SelectTrigger className="h-8 text-xs flex-1">
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

        <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced filters button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 relative">
              <Filter className="h-3.5 w-3.5" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base">Filtros Avançados</SheetTitle>
            </SheetHeader>

            <div className="space-y-4 overflow-y-auto h-[calc(85vh-120px)] pb-4">
              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account */}
              <div className="space-y-1.5">
                <Label className="text-xs">Conta</Label>
                <Select value={filters.accountId} onValueChange={(value) => handleFilterChange('accountId', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="text-sm">{account.name} - {account.bank}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Card */}
              <div className="space-y-1.5">
                <Label className="text-xs">Cartão</Label>
                <Select value={filters.cardId} onValueChange={(value) => handleFilterChange('cardId', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        <span className="text-sm">{card.name} - *{card.last_four_digits}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minAmount" className="text-xs">Valor Mín.</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="h-9 text-sm"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxAmount" className="text-xs">Valor Máx.</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="h-9 text-sm"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllFilters}
                className="flex-1 h-9 text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpar
              </Button>
              <Button 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="flex-1 h-9 text-xs"
              >
                Aplicar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default TransactionFiltersAdvancedMobile;
