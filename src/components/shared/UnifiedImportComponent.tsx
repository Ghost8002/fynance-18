import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  FileText, 
  Upload, 
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import SimpleImportComponent from './SimpleImportComponent';
import SimpleOFXImportComponent from './SimpleOFXImportComponent';

const UnifiedImportComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'xlsx' | 'ofx'>('xlsx');

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full">
            <Upload className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold">Importar Transações</CardTitle>
        <p className="text-muted-foreground mt-2">
          Escolha o formato do arquivo e importe suas transações de forma rápida e simples
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'xlsx' | 'ofx')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="xlsx" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Planilha XLSX
            </TabsTrigger>
            <TabsTrigger value="ofx" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Extrato OFX
            </TabsTrigger>
          </TabsList>

          <TabsContent value="xlsx" className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold">Importação XLSX</h2>
              </div>
              <p className="text-muted-foreground">
                Importe transações de planilhas Excel (.xlsx, .xls) com mapeamento automático de colunas
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-700 dark:text-green-300">Formato Simples</h3>
                <p className="text-sm text-green-600 dark:text-green-400">Apenas Data, Descrição e Valor obrigatórios</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Info className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">Mapeamento Automático</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">Detecção inteligente de colunas</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <Upload className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-700 dark:text-purple-300">Importação Direta</h3>
                <p className="text-sm text-purple-600 dark:text-purple-400">Sem validações desnecessárias</p>
              </div>
            </div>

            <SimpleImportComponent />
          </TabsContent>

          <TabsContent value="ofx" className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Importação OFX</h2>
              </div>
              <p className="text-muted-foreground">
                Importe extratos bancários no formato OFX (.ofx) com categorização automática inteligente
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">Formato Padrão</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">Suporte a todos os bancos brasileiros</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <Info className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-700 dark:text-green-300">Categorização Inteligente</h3>
                <p className="text-sm text-green-600 dark:text-green-400">Baseada em palavras-chave</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <Upload className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold text-orange-700 dark:text-orange-300">Processamento Rápido</h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">Parse otimizado de XML</p>
              </div>
            </div>

            <SimpleOFXImportComponent />
          </TabsContent>
        </Tabs>

        {/* Informações gerais */}
        <div className="mt-8 p-6 bg-muted/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Como Funciona a Importação Simplificada</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• <strong>Upload direto:</strong> Selecione o arquivo e a conta de destino</p>
                <p>• <strong>Processamento automático:</strong> O sistema detecta e mapeia as colunas automaticamente</p>
                <p>• <strong>Importação imediata:</strong> Sem validações complexas ou mapeamentos manuais</p>
                <p>• <strong>Ajustes pós-importação:</strong> Edite categorias e tags após a importação, se necessário</p>
                <p>• <strong>Performance otimizada:</strong> Processamento rápido sem algoritmos complexos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparação de formatos */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <FileSpreadsheet className="h-5 w-5" />
                XLSX - Planilhas Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Formato familiar e fácil de editar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Mapeamento automático de colunas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Suporte a múltiplas abas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Ideal para dados estruturados</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <FileText className="h-5 w-5" />
                OFX - Extratos Bancários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Formato padrão dos bancos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Categorização automática inteligente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Dados precisos e confiáveis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Ideal para extratos mensais</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedImportComponent;
