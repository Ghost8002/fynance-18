/**
 * Componente para testar o sistema de categorização melhorado
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { getImprovedCategoryEngine } from '@/utils/categorization/ImprovedCategoryEngine';

interface TestTransaction {
  description: string;
  amount: number;
  originalType: 'income' | 'expense';
}

export function CategorizationTestComponent() {
  const [testTransaction, setTestTransaction] = useState<TestTransaction>({
    description: 'PIX recebido de João Silva',
    amount: 150.00,
    originalType: 'expense' // Intencionalmente incorreto para testar correção
  });

  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testCategorization = () => {
    setIsLoading(true);
    
    try {
      const engine = getImprovedCategoryEngine();
      const result = engine.categorizeWithCorrections({
        description: testTransaction.description,
        amount: testTransaction.amount,
        originalType: testTransaction.originalType,
        date: new Date().toISOString().split('T')[0]
      });

      setResults(result);
    } catch (error) {
      console.error('Erro no teste de categorização:', error);
      setResults({ error: 'Erro ao processar categorização' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetTest = () => {
    setResults(null);
  };

  const sampleTransactions = [
    { description: 'PIX recebido de João Silva', amount: 150.00, originalType: 'expense' as const },
    { description: 'Pagamento de boleto - Supermercado ABC', amount: -89.50, originalType: 'income' as const },
    { description: 'Transferência enviada para Maria', amount: 200.00, originalType: 'income' as const },
    { description: 'Salário - Empresa XYZ', amount: 3000.00, originalType: 'expense' as const },
    { description: 'Compra no cartão - Posto Shell', amount: -120.00, originalType: 'income' as const },
    { description: 'Depósito em dinheiro', amount: 500.00, originalType: 'expense' as const },
    { description: 'Taxa de manutenção da conta', amount: -15.00, originalType: 'income' as const },
    { description: 'Freelance - Projeto Web', amount: 800.00, originalType: 'expense' as const }
  ];

  const loadSample = (sample: TestTransaction) => {
    setTestTransaction(sample);
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Teste de Categorização Melhorada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Transação</Label>
              <Textarea
                id="description"
                value={testTransaction.description}
                onChange={(e) => setTestTransaction(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: PIX recebido de João Silva"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={testTransaction.amount}
                onChange={(e) => setTestTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="150.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Tipo Original (Incorreto)</Label>
              <Select
                value={testTransaction.originalType}
                onValueChange={(value: 'income' | 'expense') => 
                  setTestTransaction(prev => ({ ...prev, originalType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={testCategorization} disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Testar Categorização
            </Button>
            <Button variant="outline" onClick={resetTest}>
              <RefreshCw className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exemplos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos para Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sampleTransactions.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => loadSample(sample)}
                className="justify-start text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium text-sm">{sample.description}</div>
                  <div className="text-xs text-gray-500">
                    R$ {sample.amount} - Tipo: {sample.originalType === 'income' ? 'Receita' : 'Despesa'}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.error ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Resultado da Categorização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.error ? (
              <Alert variant="destructive">
                <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Transação Original</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div><strong>Descrição:</strong> {testTransaction.description}</div>
                      <div><strong>Valor:</strong> R$ {testTransaction.amount.toFixed(2)}</div>
                      <div><strong>Tipo:</strong> {testTransaction.originalType === 'income' ? 'Receita' : 'Despesa'}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Resultado da Categorização</Label>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <div><strong>Categoria:</strong> {results.category}</div>
                      <div><strong>Confiança:</strong> {results.confidence}%</div>
                      <div><strong>Método:</strong> {results.method}</div>
                      <div><strong>Palavra-chave:</strong> {results.matchedKeyword}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Correções de Tipo */}
                {results.correctedType && (
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      <div className="font-medium mb-1">Correção de Tipo Aplicada:</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {testTransaction.originalType === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                        <span>→</span>
                        <Badge>
                          {results.correctedType === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </div>
                      <div className="text-sm mt-1">
                        <strong>Motivo:</strong> {results.typeCorrectionReason}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Avisos de Validação */}
                {results.validationWarnings && results.validationWarnings.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Avisos de Validação</Label>
                    {results.validationWarnings.map((warning: string, index: number) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{warning}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
