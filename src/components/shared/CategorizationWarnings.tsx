/**
 * Componente para exibir avisos e correções de categorização
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ArrowRight, 
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { ImprovedCategorizationResult } from '@/utils/categorization/ImprovedCategoryEngine';

interface CategorizationWarningsProps {
  results: Array<{
    description: string;
    amount: number;
    originalType: 'income' | 'expense';
    result: ImprovedCategorizationResult | null;
  }>;
  onAcceptCorrection?: (index: number) => void;
  onRejectCorrection?: (index: number) => void;
  onToggleWarning?: (index: number, warningIndex: number) => void;
  className?: string;
}

export function CategorizationWarnings({
  results,
  onAcceptCorrection,
  onRejectCorrection,
  onToggleWarning,
  className
}: CategorizationWarningsProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());
  const [dismissedWarnings, setDismissedWarnings] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const dismissWarning = (warningId: string) => {
    setDismissedWarnings(prev => new Set([...prev, warningId]));
  };

  // Filtrar resultados com problemas
  const problematicResults = results.filter(({ result }, index) => {
    if (!result) return false;
    
    const hasTypeCorrection = result.correctedType && result.correctedType !== results[index].originalType;
    const hasWarnings = result.validationWarnings && result.validationWarnings.length > 0;
    
    return hasTypeCorrection || hasWarnings;
  });

  if (problematicResults.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">
          Categorização Bem-sucedida
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Todas as transações foram categorizadas corretamente sem necessidade de correções.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">
          Atenção: Correções Necessárias
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          {problematicResults.length} transação(ões) precisam de sua atenção. 
          Verifique as correções sugeridas abaixo.
        </AlertDescription>
      </Alert>

      {problematicResults.map(({ description, amount, originalType, result }, index) => {
        if (!result) return null;

        const hasTypeCorrection = result.correctedType && result.correctedType !== originalType;
        const hasWarnings = result.validationWarnings && result.validationWarnings.length > 0;
        const isExpanded = expandedItems.has(index);
        const warningId = `warning-${index}`;

        if (dismissedWarnings.has(warningId)) return null;

        return (
          <Card key={index} className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {description}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      R$ {Math.abs(amount).toFixed(2)}
                    </Badge>
                    {hasTypeCorrection && (
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={originalType === 'income' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {originalType === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge 
                          variant={result.correctedType === 'income' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {result.correctedType === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {(result as any).category || 'Sem categoria'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(index)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissWarning(warningId)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {hasTypeCorrection && (
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800 dark:text-blue-200">
                        Correção de Tipo Sugerida
                      </AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-300">
                        {result.typeCorrectionReason}
                      </AlertDescription>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => onAcceptCorrection?.(index)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Aceitar Correção
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRejectCorrection?.(index)}
                        >
                          Manter Original
                        </Button>
                      </div>
                    </Alert>
                  )}

                  {hasWarnings && result.validationWarnings?.map((warning, warningIndex) => (
                    <Alert key={warningIndex} className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                        {warning}
                      </AlertDescription>
                    </Alert>
                  ))}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Confiança: {result.confidence}%</span>
                    <span>Método: {(result as any).method || 'automático'}</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
