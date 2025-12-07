import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wrench, CheckCircle, AlertTriangle, Download, Upload, RefreshCw } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { analyzeTransactionInconsistencies, fixTransactionInconsistencies, generateInconsistencyReport, TransactionFix } from '@/utils/transactionDataFixer';
import { useToast } from '@/hooks/use-toast';
export const TransactionDataFixer = () => {
  const {
    user
  } = useSupabaseAuth();
  const {
    toast
  } = useToast();
  const [inconsistencies, setInconsistencies] = useState<TransactionFix[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const [fixResult, setFixResult] = useState<{
    success: number;
    errors: number;
    details: string[];
  } | null>(null);
  const analyzeData = async () => {
    if (!user) return;
    setIsAnalyzing(true);
    try {
      const found = await analyzeTransactionInconsistencies(user.id);
      setInconsistencies(found);
      setFixResult(null);
      
      if (found.length === 0) {
        // Nenhuma inconsistência encontrada - sem notificação
      } else {
        // Correção automática imediatamente após encontrar inconsistências
        // Executar correção automática
        setTimeout(() => {
          fixData();
        }, 1000);
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
  const fixData = async (inconsistenciesToFix = inconsistencies) => {
    if (!user || inconsistenciesToFix.length === 0) return;
    setIsFixing(true);
    setFixProgress(0);
    try {
      const result = await fixTransactionInconsistencies(user.id, inconsistenciesToFix);
      setFixResult(result);
      
      if (result.success > 0) {
        // Limpar inconsistências após correção bem-sucedida
        setInconsistencies([]);
        
        // Re-analisar após correção para verificar se há mais problemas
        setTimeout(() => {
          analyzeData();
        }, 2000);
      }
      
      if (result.errors > 0) {
        toast({
          title: "Alguns erros ocorreram",
          description: `${result.errors} transações não puderam ser corrigidas automaticamente.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao corrigir dados:', error);
      toast({
        title: "Erro na correção automática",
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
    const blob = new Blob([report], {
      type: 'text/plain'
    });
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
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Correção Automática de Transações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Análise */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analisando dados...</span>
              </>
            ) : isFixing ? (
              <>
                <Wrench className="h-4 w-4 animate-spin" />
                <span className="text-sm text-blue-600">Corrigindo automaticamente...</span>
              </>
            ) : inconsistencies.length === 0 ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Dados validados e corrigidos automaticamente</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600">
                  {inconsistencies.length} inconsistência(s) sendo corrigida(s)...
                </span>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={analyzeData}
              disabled={isAnalyzing || isFixing}
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-analisar
            </Button>
            
            {inconsistencies.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadReport}
              >
                <Download className="h-4 w-4" />
                Relatório
              </Button>
            )}
          </div>
        </div>

        {/* Lista de Inconsistências */}
        {inconsistencies.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Inconsistências sendo corrigidas automaticamente:</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {inconsistencies.map((inconsistency, index) => (
                <div key={inconsistency.id} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inconsistency.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {inconsistency.currentType === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                      <span>R$ {inconsistency.currentAmount.toFixed(2)}</span>
                      <span>→</span>
                      <span className="text-green-600">R$ {inconsistency.fixedAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progresso da Correção Automática */}
        {isFixing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Correção automática em andamento...</span>
            </div>
            <Progress value={fixProgress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">
              Corrigindo {inconsistencies.length} transação(ões)...
            </p>
          </div>
        )}

        {/* Resultado da Correção */}
        {fixResult && (
          <Alert className={fixResult.errors > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">
                  {fixResult.success > 0 && `✅ ${fixResult.success} transação(ões) corrigida(s) com sucesso`}
                </p>
                {fixResult.errors > 0 && (
                  <p className="text-orange-600">
                    ⚠️ {fixResult.errors} transação(ões) não puderam ser corrigidas
                  </p>
                )}
                {fixResult.details.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer">Ver detalhes</summary>
                    <div className="mt-1 text-xs space-y-1">
                      {fixResult.details.map((detail, index) => (
                        <p key={index} className="font-mono">{detail}</p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};