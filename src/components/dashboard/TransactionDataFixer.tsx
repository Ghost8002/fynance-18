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
        toast({
          title: "Análise concluída",
          description: "Nenhuma inconsistência encontrada!"
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
          description: `${result.success} transações corrigidas com sucesso!`
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Corretor de Dados de Transações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={analyzeData} 
            disabled={isAnalyzing || !user}
            variant="outline"
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            {isAnalyzing ? 'Analisando...' : 'Analisar Dados'}
          </Button>
          
          {inconsistencies.length > 0 && (
            <>
              <Button 
                onClick={fixData} 
                disabled={isFixing || inconsistencies.length === 0}
              >
                {isFixing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isFixing ? 'Corrigindo...' : 'Corrigir Dados'}
              </Button>
              
              <Button 
                onClick={downloadReport} 
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório
              </Button>
            </>
          )}
        </div>

        {inconsistencies.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {inconsistencies.length} inconsistências encontradas que precisam ser corrigidas.
            </AlertDescription>
          </Alert>
        )}

        {isFixing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso da correção</span>
              <span>{fixProgress}%</span>
            </div>
            <Progress value={fixProgress} />
          </div>
        )}

        {fixResult && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Badge variant="success">
                {fixResult.success} corrigidas
              </Badge>
              {fixResult.errors > 0 && (
                <Badge variant="destructive">
                  {fixResult.errors} erros
                </Badge>
              )}
            </div>
            
            {fixResult.details.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1">
                {fixResult.details.slice(0, 5).map((detail, index) => (
                  <div key={index}>• {detail}</div>
                ))}
                {fixResult.details.length > 5 && (
                  <div>... e mais {fixResult.details.length - 5} itens</div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};