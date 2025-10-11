import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useCalendarFilters } from "@/hooks/useCalendarFilters";
import CalendarEventCard from "./CalendarEventCard";
import CalendarFilters from "./CalendarFilters";
import CalendarLegend from "./CalendarLegend";
import CalendarStats from "./CalendarStats";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
const FinancialCalendar = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const {
    events,
    getEventsForDate,
    hasEventsForDate,
    getEventTypesForDate,
    loading
  } = useCalendarEvents();
  const {
    filters,
    filteredEvents,
    toggleEventType,
    toggleShowOverdue,
    setSearchTerm,
    clearFilters
  } = useCalendarFilters(events);

  // Filtrar eventos para a data selecionada
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dayEvents = getEventsForDate(selectedDate);
    return dayEvents.filter(event => {
      if (!filters.eventTypes.includes(event.type)) return false;
      if (!filters.showOverdue && event.status === 'overdue') return false;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return event.description.toLowerCase().includes(searchLower) || event.title.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [selectedDate, getEventsForDate, filters]);
  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  const handleNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const getDayBalance = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    return dayEvents.reduce((total, event) => {
      if (event.type === 'transaction') {
        return total + event.amount;
      }
      return total;
    }, 0);
  };
  const getMonthStats = () => {
    const monthEvents = events.filter(event => event.date.getMonth() === currentDate.getMonth() && event.date.getFullYear() === currentDate.getFullYear());
    const income = monthEvents.filter(event => event.type === 'transaction' && event.amount > 0).reduce((sum, event) => sum + event.amount, 0);
    const expenses = monthEvents.filter(event => event.type === 'transaction' && event.amount < 0).reduce((sum, event) => sum + event.amount, 0);
    const receivables = monthEvents.filter(event => event.type === 'receivable').reduce((sum, event) => sum + event.amount, 0);
    const debts = monthEvents.filter(event => event.type === 'debt').reduce((sum, event) => sum + event.amount, 0);
    const overdue = monthEvents.filter(event => event.status === 'overdue').length;
    return {
      income,
      expenses,
      receivables,
      debts,
      overdue
    };
  };
  const monthStats = getMonthStats();
  if (loading) {
    return <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <DashboardSkeleton variant="chart" />
          </div>
          <div>
            <DashboardSkeleton variant="list" rows={5} />
          </div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header com estatísticas do mês e filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Primeira coluna: Receitas */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:border-green-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Receitas</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(monthStats.income)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">A Receber</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(monthStats.receivables)}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segunda coluna: Despesas */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Despesas</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(monthStats.expenses)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Dívidas</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(monthStats.debts)}</p>
                  {monthStats.overdue > 0 && <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />
                      <span className="text-xs text-red-600 dark:text-red-400">{monthStats.overdue} vencidas</span>
                    </div>}
                </div>
                <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terceira e quarta colunas: Filtros */}
        <div className="lg:col-span-2">
          <CalendarFilters eventTypes={filters.eventTypes} showOverdue={filters.showOverdue} searchTerm={filters.searchTerm} onToggleEventType={toggleEventType} onToggleShowOverdue={toggleShowOverdue} onSearchChange={setSearchTerm} onClearFilters={clearFilters} />
        </div>
      </div>

      {/* Calendário e Detalhes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendário Financeiro
                </CardTitle>
                <div className="flex items-center gap-3">
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium min-w-[140px] text-center">
                      {currentDate.toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} month={currentDate} className="rounded-md w-full" classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1 text-center",
              row: "flex w-full mt-2",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
              day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-semibold",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible"
            }} components={{
              DayContent: props => {
                const eventTypes = getEventTypesForDate(props.date);
                const dayBalance = getDayBalance(props.date);
                const hasEvents = eventTypes.length > 0;
                return <div className="relative flex flex-col items-center justify-center w-full h-full p-1">
                        <span className="text-sm mb-1">{props.date.getDate()}</span>
                        {hasEvents && <div className="flex gap-0.5 justify-center mb-1">
                            {eventTypes.includes('transaction') && <div className={`w-2 h-2 rounded-full ${dayBalance >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />}
                            {eventTypes.includes('receivable') && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            {eventTypes.includes('debt') && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                          </div>}
                        {dayBalance !== 0 && <span className={`text-xs font-medium ${dayBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {dayBalance >= 0 ? '+' : ''}{formatCurrency(dayBalance).slice(0, -3)}
                          </span>}
                      </div>;
              }
            }} />
            </CardContent>
          </Card>
        </div>

        {/* Painel de Detalhes Melhorado */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {selectedDate ? selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                }) : "Selecione uma data"}
                </CardTitle>
                {selectedDate && selectedDateEvents.length > 0 && <Badge variant="secondary">
                    {selectedDateEvents.length} evento{selectedDateEvents.length !== 1 ? 's' : ''}
                  </Badge>}
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {selectedDateEvents.length > 0 ? <div className="space-y-3">
                  {selectedDateEvents.map(event => <CalendarEventCard key={event.id} event={event} />)}
                  
                  {/* Resumo do dia melhorado */}
                  <div className="pt-4 border-t mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Saldo do dia</span>
                      <span className={`font-bold text-lg ${getDayBalance(selectedDate!) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(getDayBalance(selectedDate!))}
                      </span>
                    </div>
                    
                    {/* Breakdown por tipo */}
                    <div className="space-y-1 text-xs">
                      {selectedDateEvents.some(e => e.type === 'transaction' && e.amount > 0) && <div className="flex justify-between">
                          <span className="text-green-600">Receitas:</span>
                          <span className="text-green-600">
                            {formatCurrency(selectedDateEvents.filter(e => e.type === 'transaction' && e.amount > 0).reduce((sum, e) => sum + e.amount, 0))}
                          </span>
                        </div>}
                      {selectedDateEvents.some(e => e.type === 'transaction' && e.amount < 0) && <div className="flex justify-between">
                          <span className="text-red-600">Despesas:</span>
                          <span className="text-red-600">
                            {formatCurrency(selectedDateEvents.filter(e => e.type === 'transaction' && e.amount < 0).reduce((sum, e) => sum + e.amount, 0))}
                          </span>
                        </div>}
                    </div>
                  </div>
                </div> : <div className="py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">
                    {selectedDate ? "Nenhum evento para este dia" : "Selecione uma data"}
                  </p>
                  {selectedDate && filters.searchTerm && <p className="text-sm text-muted-foreground mt-2">
                      Nenhum resultado para "{filters.searchTerm}"
                    </p>}
                </div>}
            </CardContent>
          </Card>

          {/* Estatísticas adicionais */}
          <CalendarStats events={filteredEvents} selectedMonth={currentDate} />
        </div>
      </div>
    </div>;
};
export default FinancialCalendar;