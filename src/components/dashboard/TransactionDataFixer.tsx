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
  return;
};