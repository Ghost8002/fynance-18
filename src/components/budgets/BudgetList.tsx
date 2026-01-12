
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Trash2, Search, Filter, SortAsc, SortDesc, Calendar, DollarSign } from "lucide-react";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { parseLocalDate } from "@/utils/dateValidation";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const BudgetList = () => {
  const { user } = useSupabaseAuth();
  const { data: budgets, loading, error, remove } = useRealtimeData('budgets');
  const { data: categories } = useRealtimeData('categories');
  const { data: transactions } = useRealtimeData('transactions');
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Create category map for lookup
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);

  // Calculate spending for each budget
  const budgetsWithSpending = useMemo(() => {
    return budgets.map(budget => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const categoryTransactions = transactions.filter(transaction => {
        const transactionDate = parseLocalDate(transaction.date);
        return transaction.category_id === budget.category_id &&
               transaction.type === 'expense' &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      });
      
      const spent = categoryTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const percentage = (spent / Number(budget.limit_amount)) * 100;
      
      let status = 'good';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';
      else if (percentage >= 50) status = 'moderate';
      
      return {
        ...budget,
        categoryName: categoryMap[budget.category_id] || 'Categoria removida',
        spent,
        percentage,
        status,
        remaining: Number(budget.limit_amount) - spent
      };
    });
  }, [budgets, transactions, categoryMap]);

  // Filter and sort budgets
  const filteredAndSortedBudgets = useMemo(() => {
    let filtered = budgetsWithSpending;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(budget =>
        budget.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.categoryName.localeCompare(b.categoryName);
          break;
        case "spent":
          comparison = a.spent - b.spent;
          break;
        case "percentage":
          comparison = a.percentage - b.percentage;
          break;
        case "remaining":
          comparison = a.remaining - b.remaining;
          break;
        case "limit":
          comparison = Number(a.limit_amount) - Number(b.limit_amount);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [budgetsWithSpending, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleDelete = async (budgetId: string) => {
    setDeletingId(budgetId);
    
    try {
      const { error } = await remove(budgetId);
      
      if (error) {
        throw new Error(error);
      }
      
      toast({
        title: "Sucesso",
        description: "Orçamento removido com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o orçamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando orçamentos...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Erro ao carregar orçamentos: {error}</div>;
  }

  if (budgetsWithSpending.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="flex flex-col items-center justify-center p-4 md:p-6 border-dashed">
          <Plus size={32} className="text-gray-400 mb-3 md:mb-4" />
          <h3 className="text-sm md:text-lg font-medium text-gray-700 mb-1 md:mb-2">Criar Orçamento</h3>
          <p className="text-xs md:text-sm text-gray-500 text-center mb-3 md:mb-4">
            Defina limites de gastos por categoria
          </p>
          <Button size="sm" className="text-xs md:text-sm">Criar Orçamento</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card className="p-2 md:p-4">
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar orçamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 md:pl-10 h-7 md:h-10 text-[10px] md:text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32 md:w-40 h-7 md:h-10 text-[10px] md:text-sm">
              <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[10px] md:text-sm">Todos</SelectItem>
              <SelectItem value="exceeded" className="text-[10px] md:text-sm">Excedidos</SelectItem>
              <SelectItem value="warning" className="text-[10px] md:text-sm">Atenção</SelectItem>
              <SelectItem value="moderate" className="text-[10px] md:text-sm">Moderado</SelectItem>
              <SelectItem value="good" className="text-[10px] md:text-sm">Bom</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-32 md:w-40 h-7 md:h-10 text-[10px] md:text-sm">
              <SortAsc className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name" className="text-[10px] md:text-sm">Nome</SelectItem>
              <SelectItem value="spent" className="text-[10px] md:text-sm">Gasto</SelectItem>
              <SelectItem value="percentage" className="text-[10px] md:text-sm">Percentual</SelectItem>
              <SelectItem value="remaining" className="text-[10px] md:text-sm">Restante</SelectItem>
              <SelectItem value="limit" className="text-[10px] md:text-sm">Limite</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="h-7 md:h-10 px-2 md:px-3"
          >
            {sortOrder === "asc" ? <SortAsc className="h-3 w-3 md:h-4 md:w-4" /> : <SortDesc className="h-3 w-3 md:h-4 md:w-4" />}
          </Button>
        </div>

        {/* Results count */}
        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t">
          <p className="text-[9px] md:text-xs text-muted-foreground">
            {filteredAndSortedBudgets.length} de {budgetsWithSpending.length} orçamentos
          </p>
        </div>
      </Card>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filteredAndSortedBudgets.map((budget) => {
          const isOverBudget = budget.percentage > 100;
          const isNearLimit = budget.percentage >= 80 && budget.percentage < 100;
          
          return (
            <Card key={budget.id} className={`${isOverBudget ? "border-red-300 bg-red-50/50" : isNearLimit ? "border-yellow-300 bg-yellow-50/50" : ""} p-3 md:p-6 hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-2 px-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-sm md:text-lg truncate">{budget.categoryName}</CardTitle>
                      <Badge 
                        variant={budget.status === 'exceeded' ? 'destructive' : budget.status === 'warning' ? 'secondary' : 'outline'}
                        className={`text-xs ${
                          budget.status === 'exceeded' ? 'bg-red-100 text-red-800' :
                          budget.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          budget.status === 'moderate' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {budget.status === 'exceeded' ? 'Excedido' :
                         budget.status === 'warning' ? 'Atenção' :
                         budget.status === 'moderate' ? 'Moderado' : 'Bom'}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground capitalize flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {budget.period}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 ml-2">
                    {isOverBudget && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(budget.id)}
                      disabled={deletingId === budget.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 size={14} className="md:hidden" />
                      <Trash2 size={16} className="hidden md:block" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm truncate">
                      {formatCurrency(budget.spent)} de {formatCurrency(Number(budget.limit_amount))}
                    </span>
                    <span 
                      className={`text-xs md:text-sm font-medium ${
                        isOverBudget ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-green-500"
                      }`}
                    >
                      {isOverBudget ? `${formatCurrency(Math.abs(budget.remaining))} acima` : `${formatCurrency(budget.remaining)} restantes`}
                    </span>
                  </div>
                  
                  <Progress 
                    value={budget.percentage > 100 ? 100 : budget.percentage} 
                    className="h-1.5 md:h-2"
                    indicatorClassName={isOverBudget ? "bg-red-600" : isNearLimit ? "bg-amber-600" : "bg-green-600"}
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm text-gray-500">
                      {budget.percentage.toFixed(0)}% utilizado
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>{formatCurrency(Number(budget.limit_amount))}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Card className="flex flex-col items-center justify-center p-4 md:p-6 border-dashed hover:border-primary/50 transition-colors">
          <Plus size={32} className="text-gray-400 mb-3 md:mb-4" />
          <h3 className="text-sm md:text-lg font-medium text-gray-700 mb-1 md:mb-2">Criar Orçamento</h3>
          <p className="text-xs md:text-sm text-gray-500 text-center mb-3 md:mb-4">
            Defina limites de gastos por categoria
          </p>
          <Button size="sm" className="text-xs md:text-sm">Criar Orçamento</Button>
        </Card>
      </div>
    </div>
  );
};

export default BudgetList;
