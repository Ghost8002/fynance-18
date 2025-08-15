import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Repeat, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecurrenceProgressProps {
  isRecurring: boolean;
  recurrenceType?: string;
  currentCount?: number;
  maxOccurrences?: number;
  endDate?: string;
}

export const RecurrenceProgress = ({ 
  isRecurring, 
  recurrenceType, 
  currentCount = 0, 
  maxOccurrences,
  endDate 
}: RecurrenceProgressProps) => {
  if (!isRecurring) return null;

  const typeLabels = {
    'weekly': 'Semanal',
    'monthly': 'Mensal',
    'yearly': 'Anual'
  };

  const hasLimit = maxOccurrences || endDate;
  const progress = maxOccurrences ? (currentCount / maxOccurrences) * 100 : 0;

  return (
    <div className="space-y-2">
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <Repeat className="h-3 w-3" />
        {typeLabels[recurrenceType as keyof typeof typeLabels] || 'Recorrente'}
      </Badge>
      
      {hasLimit && (
        <div className="space-y-1">
          {maxOccurrences && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>{currentCount} de {maxOccurrences} ocorrências</span>
            </div>
          )}
          
          {endDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Até {format(new Date(endDate), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
          
          {maxOccurrences && (
            <Progress value={progress} className="h-1" />
          )}
        </div>
      )}
    </div>
  );
};