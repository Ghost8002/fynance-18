
import { useState, useMemo } from 'react';
import { CalendarEvent, CalendarEventType } from './useCalendarEvents';

export interface CalendarFilters {
  eventTypes: CalendarEventType[];
  showOverdue: boolean;
  searchTerm: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const useCalendarFilters = (events: CalendarEvent[]) => {
  const [filters, setFilters] = useState<CalendarFilters>({
    eventTypes: ['transaction', 'receivable', 'debt'],
    showOverdue: true,
    searchTerm: ''
  });

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filtro por tipo
      if (!filters.eventTypes.includes(event.type)) {
        return false;
      }

      // Filtro por eventos vencidos
      if (!filters.showOverdue && event.status === 'overdue') {
        return false;
      }

      // Filtro por termo de busca
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          event.description.toLowerCase().includes(searchLower) ||
          event.title.toLowerCase().includes(searchLower) ||
          (event.category && event.category.toLowerCase().includes(searchLower)) ||
          (event.account && event.account.toLowerCase().includes(searchLower))
        );
      }

      // Filtro por intervalo de datas
      if (filters.dateRange) {
        const eventDate = event.date;
        return eventDate >= filters.dateRange.start && eventDate <= filters.dateRange.end;
      }

      return true;
    });
  }, [events, filters]);

  const toggleEventType = (type: CalendarEventType) => {
    setFilters(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(type)
        ? prev.eventTypes.filter(t => t !== type)
        : [...prev.eventTypes, type]
    }));
  };

  const toggleShowOverdue = () => {
    setFilters(prev => ({ ...prev, showOverdue: !prev.showOverdue }));
  };

  const setSearchTerm = (term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  };

  const setDateRange = (range: { start: Date; end: Date } | undefined) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  };

  const clearFilters = () => {
    setFilters({
      eventTypes: ['transaction', 'receivable', 'debt'],
      showOverdue: true,
      searchTerm: '',
      dateRange: undefined
    });
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.searchTerm) {
      activeFilters.push(`Busca: "${filters.searchTerm}"`);
    }
    
    if (filters.eventTypes.length < 3) {
      const typeLabels = {
        transaction: 'Transações',
        receivable: 'A Receber',
        debt: 'Dívidas'
      };
      activeFilters.push(`Tipos: ${filters.eventTypes.map(t => typeLabels[t]).join(', ')}`);
    }
    
    if (!filters.showOverdue) {
      activeFilters.push('Vencidos: Ocultos');
    }
    
    if (filters.dateRange) {
      activeFilters.push(`Período: ${filters.dateRange.start.toLocaleDateString('pt-BR')} - ${filters.dateRange.end.toLocaleDateString('pt-BR')}`);
    }
    
    return activeFilters;
  };

  return {
    filters,
    filteredEvents,
    toggleEventType,
    toggleShowOverdue,
    setSearchTerm,
    setDateRange,
    clearFilters,
    getFilterSummary,
    hasActiveFilters: getFilterSummary().length > 0
  };
};
