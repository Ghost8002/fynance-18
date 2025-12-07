/**
 * Página para testar o sistema de categorização customizado
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Database, Zap } from 'lucide-react';
import { CustomCategorizationTest } from '@/components/shared/CustomCategorizationTest';

export default function CategorizationTestPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Sistema de Categorização Customizado</h1>
        </div>
        
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Este sistema utiliza especificamente o banco de dados <strong>CATEGORIAS E PALAVRAS-CHAVE.txt</strong> 
            para categorização automática de transações. Teste diferentes descrições e veja como o sistema 
            categoriza automaticamente com base nas palavras-chave definidas.
          </AlertDescription>
        </Alert>
      </div>

      {/* Informações sobre o Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Categorias Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">14</div>
            <div className="text-sm text-green-600">Categorias configuradas</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Palavras-chave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">340+</div>
            <div className="text-sm text-blue-600">Palavras-chave mapeadas</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-800 dark:text-purple-200 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Precisão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">85%+</div>
            <div className="text-sm text-purple-600">Taxa de acerto estimada</div>
          </CardContent>
        </Card>
      </div>

      {/* Componente de Teste */}
      <CustomCategorizationTest />

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona o Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Métodos de Categorização:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• <strong>Exata:</strong> Busca por palavras-chave exatas</li>
                <li>• <strong>Parcial:</strong> Busca por palavras-chave contidas na descrição</li>
                <li>• <strong>Contexto:</strong> Análise semântica (PIX, transferências, etc.)</li>
                <li>• <strong>Validação:</strong> Verificação de consistência tipo/categoria</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Recursos Avançados:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• <strong>Correção de Tipo:</strong> Detecta e corrige receitas/despesas</li>
                <li>• <strong>Confiança:</strong> Score de 0-100% para cada categorização</li>
                <li>• <strong>Avisos:</strong> Alertas para inconsistências detectadas</li>
                <li>• <strong>Alternativas:</strong> Sugestões de categorias alternativas</li>
              </ul>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <strong>Dica:</strong> O sistema funciona melhor com descrições detalhadas. 
              Tente usar termos específicos como "supermercado", "posto", "PIX recebido", etc.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
