
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface TransactionFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    dateRange: string;
    type: string;
    categoryId: string;
    accountId: string;
    cardId: string;
  }) => void;
}

const TransactionFilters = ({ onFiltersChange }: TransactionFiltersProps) => {
  const { user } = useSupabaseAuth();
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: cards } = useSupabaseData('cards', user?.id);

  const [filters, setFilters] = useState({
    search: "",
    dateRange: "current-month",
    type: "all",
    categoryId: "all",
    accountId: "all",
    cardId: "all",
  });

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: string, value: string) => {
    // Clear category filter when transaction type changes
    if (key === 'type' && filters.categoryId !== 'all') {
      setFilters(prev => ({ ...prev, [key]: value, categoryId: 'all' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  // Filter categories based on selected transaction type
  const filteredCategories = (categories || []).filter(category => {
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
    <div className="bg-card border border-border rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="relative">
          <Input 
            type="text" 
            placeholder="Pesquisar transações..." 
            className="pl-9 bg-background border-border text-foreground"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <Search 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            size={18} 
          />
        </div>

        <div>
          <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="last-7-days">Últimos 7 dias</SelectItem>
              <SelectItem value="current-month">Mês atual</SelectItem>
              <SelectItem value="last-month">Mês passado</SelectItem>
              <SelectItem value="current-year">Ano atual</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder={
                sortedCategories.length > 0 
                  ? "Categoria"
                  : filters.type === 'income' 
                    ? 'Nenhuma categoria de receita'
                    : filters.type === 'expense'
                    ? 'Nenhuma categoria de despesa'
                    : 'Categoria'
              } />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
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
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.accountId} onValueChange={(value) => handleFilterChange('accountId', value)}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todas</SelectItem>
              {(accounts || []).map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} - {account.bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.cardId} onValueChange={(value) => handleFilterChange('cardId', value)}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Cartão" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todos</SelectItem>
              {(cards || []).map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name} - *{card.last_four_digits}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
