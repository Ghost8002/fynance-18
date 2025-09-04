import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Upload,
  RefreshCw
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { 
  analyzeTransactionInconsistencies, 
  fixTransactionInconsistencies,
  generateInconsistencyReport,
  TransactionFix 
} from '@/utils/transactionDataFixer';
import { useToast } from '@/hooks/use-toast';

export const TransactionDataFixer = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [inconsistencies, setInconsistencies] = useState<TransactionFix[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const [fixResult, setFixResult] = useState<{ success: number; errors: number; details: string[] } | null>(null);

  const analyzeData = async () => {
    if (!user) return;

    setIsAnalyzing(true);
    try {
      const found = await analyzeTransactionInconsistencies(user.id);
      setInconsistencies(found);
      setFixResult(null);
      
      if (found.length === 0) {
        toast({
          title: "Análise concluída",
          description: "Nenhuma inconsistência encontrada!",
        });
      } else {
        toast({
          title: "Inconsistências encontradas",
          description: `${found.length} transações precisam ser corrigidas.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao analisar dados:', error);
      toast({
        title: "Erro na análise",
        description: "Erro ao analisar inconsistências nos dados.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fixData = async () => {
    if (!user || inconsistencies.length === 0) return;

    setIsFixing(true);
    setFixProgress(0);
    
    try {
      const result = await fixTransactionInconsistencies(user.id, inconsistencies);
      setFixResult(result);
      
      if (result.success > 0) {
        toast({
          title: "Correção concluída",
          description: `${result.success} transações corrigidas com sucesso!`,
        });
        
        // Re-analisar após correção
        setTimeout(() => {
          analyzeData();
        }, 1000);
      }
      
      if (result.errors > 0) {
        toast({
          title: "Alguns erros ocorreram",
          description: `${result.errors} transações não puderam ser corrigidas.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao corrigir dados:', error);
      toast({
        title: "Erro na correção",
        description: "Erro ao corrigir inconsistências nos dados.",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
      setFixProgress(100);
    }
  };

  const downloadReport = () => {
    const report = generateInconsistencyReport(inconsistencies);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-inconsistencias-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (user) {
      analyzeData();
    }
  }, [user]);

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Correção de Dados Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {inconsistencies.length === 0 ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Dados consistentes
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {inconsistencies.length} inconsistências
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeData}
              disabled={isAnalyzing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-analisar
            </Button>
            
            {inconsistencies.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Relatório
              </Button>
            )}
          </div>
        </div>

        {/* Relatório de Inconsistências */}
        {inconsistencies.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Inconsistências encontradas:</p>
                <div className="text-sm space-y-1">
                  {inconsistencies.slice(0, 5).map((fix, index) => (
                    <div key={fix.id} className="flex justify-between">
                      <span className="truncate">{fix.description}</span>
                      <span className="font-mono text-xs">
                        {fix.currentAmount} → {fix.fixedAmount}
                      </span>
                    </div>
                  ))}
                  {inconsistencies.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      ... e mais {inconsistencies.length - 5} inconsistências
                    </p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Botão de Correção */}
        {inconsistencies.length > 0 && (
          <div className="space-y-3">
            <Button
              onClick={fixData}
              disabled={isFixing}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isFixing ? 'Corrigindo...' : `Corrigir ${inconsistencies.length} Inconsistências`}
            </Button>
            
            {isFixing && (
              <Progress value={fixProgress} className="w-full" />
            )}
          </div>
        )}

        {/* Resultado da Correção */}
        {fixResult && (
          <Alert className={fixResult.errors > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Correção concluída:</p>
                <div className="text-sm space-y-1">
                  <p>✅ {fixResult.success} transações corrigidas</p>
                  {fixResult.errors > 0 && (
                    <p>❌ {fixResult.errors} erros</p>
                  )}
                </div>
                {fixResult.details.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer">Ver detalhes</summary>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {fixResult.details.map((detail, index) => (
                        <div key={index} className="font-mono">{detail}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Informações */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Este utilitário corrige inconsistências entre tipo e valor das transações</p>
          <p>• Receitas devem ter valores positivos, despesas devem ter valores negativos</p>
          <p>• A correção é segura e pode ser desfeita se necessário</p>
        </div>
      </CardContent>
    </Card>
  );
};
