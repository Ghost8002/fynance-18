
import { useState, useEffect } from 'react';

export interface DashboardWidget {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'financial-summary', name: 'Resumo Financeiro', visible: true, order: 1 },
  { id: 'expense-chart', name: 'Gráfico de Despesas', visible: true, order: 2 },
  { id: 'income-chart', name: 'Gráfico de Receitas', visible: true, order: 3 },
  { id: 'budget-progress', name: 'Progresso dos Orçamentos', visible: true, order: 4 },
  { id: 'recent-transactions', name: 'Transações Recentes', visible: true, order: 5 },
  { id: 'goal-tracker', name: 'Acompanhamento de Metas', visible: true, order: 6 },
  { id: 'card-overview', name: 'Visão Geral dos Cartões', visible: true, order: 7 },
  // Novos widgets específicos do Financial Summary - DESATIVADOS POR PADRÃO
  { id: 'credit-limit', name: 'Limite de Crédito Disponível', visible: false, order: 8 },
  { id: 'budgets', name: 'Orçamentos', visible: false, order: 9 },
  { id: 'goals', name: 'Progresso das Metas', visible: false, order: 10 },
  { id: 'transactions', name: 'Transações do Mês', visible: false, order: 11 },
];

export const useDashboardCustomization = () => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);

  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    if (savedWidgets) {
      try {
        const parsed = JSON.parse(savedWidgets);
        // Merge with default widgets to ensure new widgets are included
        const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
          const savedWidget = parsed.find((w: DashboardWidget) => w.id === defaultWidget.id);
          return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
        });
        setWidgets(mergedWidgets);
      } catch (error) {
        console.error('Error loading dashboard widgets:', error);
        setWidgets(DEFAULT_WIDGETS);
      }
    }
  }, []);

  const toggleWidget = (id: string) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === id ? { ...widget, visible: !widget.visible } : widget
    );
    setWidgets(updatedWidgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(updatedWidgets));
  };

  const reorderWidgets = (dragIndex: number, hoverIndex: number) => {
    const dragWidget = widgets[dragIndex];
    const updatedWidgets = [...widgets];
    updatedWidgets.splice(dragIndex, 1);
    updatedWidgets.splice(hoverIndex, 0, dragWidget);
    
    // Update order numbers
    const reorderedWidgets = updatedWidgets.map((widget, index) => ({
      ...widget,
      order: index + 1
    }));
    
    setWidgets(reorderedWidgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(reorderedWidgets));
  };

  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem('dashboard-widgets');
  };

  const isWidgetVisible = (widgetId: string): boolean => {
    const widget = widgets.find(w => w.id === widgetId);
    return widget ? widget.visible : false;
  };

  const visibleWidgets = widgets.filter(widget => widget.visible).sort((a, b) => a.order - b.order);

  return {
    widgets,
    visibleWidgets,
    toggleWidget,
    reorderWidgets,
    resetToDefault,
    isWidgetVisible,
  };
};
