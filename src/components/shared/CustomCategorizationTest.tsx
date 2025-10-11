/**
 * Componente para testar o sistema de categorização customizado
 * Baseado no banco de dados CATEGORIAS E PALAVRAS-CHAVE.txt
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Search,
  Database,
  TrendingUp
} from 'lucide-react';
import { getCustomCategoryEngine } from '@/utils/categorization/CustomCategoryEngine';
import { CUSTOM_KEYWORD_DATABASE, getCustomCategoriesByType } from '@/utils/categorization/CustomKeywordDatabase';

interface TestTransaction {
  description: string;
  amount: number;
  originalType: 'income' | 'expense';
}

interface TestResult {
  transaction: TestTransaction;
  result: any;
  timestamp: Date;
}

export function CustomCategorizationTest() {
  const [testTransaction, setTestTransaction] = useState<TestTransaction>({
    description: 'Compra no supermercado ABC',
    amount: -89.50,
    originalType: 'expense'
  });

  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const engine = getCustomCategoryEngine({
    minConfidence: 70,
    enableTypeCorrection: true
  });

  // Exemplos de transações para teste
  const sampleTransactions = [
    { description: 'Compra no supermercado ABC', amount: -89.50, originalType: 'expense' as const },
    { description: 'PIX recebido de João Silva', amount: 150.00, originalType: 'expense' as const },
    { description: 'Pagamento de boleto - Posto Shell', amount: -120.00, originalType: 'income' as const },
    { description: 'Salário - Empresa XYZ Ltda', amount: 3000.00, originalType: 'expense' as const },
    { description: 'Transferência enviada para Maria', amount: 200.00, originalType: 'income' as const },
    { description: 'Depósito em dinheiro', amount: 500.00, originalType: 'expense' as const },
    { description: 'Taxa de manutenção da conta', amount: -15.00, originalType: 'income' as const },
    { description: 'Freelance - Projeto Web', amount: 800.00, originalType: 'expense' as const },
    { description: 'Netflix - Assinatura mensal', amount: -25.90, originalType: 'income' as const },
    { description: 'Uber - Viagem para trabalho', amount: -18.50, originalType: 'income' as const }
  ];

  const testCategorization = () => {
    setIsLoading(true);
    
    try {
      const result = engine.categorize({
        description: testTransaction.description,
        amount: testTransaction.amount,
        originalType: testTransaction.originalType,
        date: new Date().toISOString().split('T')[0]
      });

      const newResult: TestResult = {
        transaction: { ...testTransaction },
        result,
        timestamp: new Date()
      };

      setResults(prev => [newResult, ...prev.slice(0, 9)]); // Manter apenas os últimos 10
    } catch (error) {
      console.error('Erro no teste de categorização:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (sample: TestTransaction) => {
    setTestTransaction(sample);
  };

  const clearResults = () => {
    setResults([]);
  };

  // Filtrar resultados por categoria
  const filteredResults = results.filter(result => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'categorized') return result.result !== null;
    if (selectedCategory === 'uncategorized') return result.result === null;
    return result.result?.categoryKey === selectedCategory;
  });

  // Estatísticas
  const stats = results.length > 0 ? engine.generateStats(results.map(r => ({
    transaction: r.transaction,
    result: r.result
  }))) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sistema de Categorização Customizado
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Baseado no banco de dados CATEGORIAS E PALAVRAS-CHAVE.txt
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Teste de Categorização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Transação</Label>
              <Textarea
                id="description"
                value={testTransaction.description}
                onChange={(e) => setTestTransaction(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Compra no supermercado ABC"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="type">Tipo Original</Label>
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
              <Button onClick={testCategorization} disabled={isLoading} className="flex-1">
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Testar Categorização
              </Button>
              <Button variant="outline" onClick={clearResults}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</div>
                    <div className="text-sm text-blue-600">Total Testado</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.categorizedTransactions}</div>
                    <div className="text-sm text-green-600">Categorizadas</div>
                  </div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(stats.averageConfidence)}%</div>
                  <div className="text-sm text-purple-600">Confiança Média</div>
                </div>

                {stats.warningsCount > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                      {stats.warningsCount} aviso(s) gerado(s)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum teste realizado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                    R$ {sample.amount} - {sample.originalType === 'income' ? 'Receita' : 'Despesa'}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Resultados dos Testes
              </CardTitle>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="categorized">Categorizadas</SelectItem>
                  <SelectItem value="uncategorized">Não Categorizadas</SelectItem>
                  {Object.entries(CUSTOM_KEYWORD_DATABASE).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredResults.map((testResult, index) => (
                <Card key={index} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Transação Original</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Descrição:</strong> {testResult.transaction.description}</div>
                          <div><strong>Valor:</strong> R$ {testResult.transaction.amount.toFixed(2)}</div>
                          <div><strong>Tipo:</strong> {testResult.transaction.originalType === 'income' ? 'Receita' : 'Despesa'}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Resultado da Categorização</h4>
                        {testResult.result ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{testResult.result.category}</Badge>
                              <Badge variant={testResult.result.type === 'income' ? 'default' : 'secondary'}>
                                {testResult.result.type === 'income' ? 'Receita' : 'Despesa'}
                              </Badge>
                              <Badge variant="outline">{testResult.result.confidence}%</Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              Método: {testResult.result.method} | 
                              Palavra: {testResult.result.matchedKeyword}
                            </div>
                            {testResult.result.warnings && (
                              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                                <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-300">
                                  {testResult.result.warnings.join(', ')}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            Não foi possível categorizar automaticamente
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Testado em: {testResult.timestamp.toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banco de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Banco de Dados de Categorias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="receitas" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="receitas">Receitas</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="receitas" className="space-y-4">
              {Object.entries(getCustomCategoriesByType('income')).map(([key, category]) => (
                <Card key={key} className="border-green-200 dark:border-green-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-800 dark:text-green-200">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {category.keywords.slice(0, 10).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {category.keywords.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.keywords.length - 10} mais
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="despesas" className="space-y-4">
              {Object.entries(getCustomCategoriesByType('expense')).map(([key, category]) => (
                <Card key={key} className="border-red-200 dark:border-red-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-800 dark:text-red-200">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {category.keywords.slice(0, 10).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {category.keywords.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.keywords.length - 10} mais
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
