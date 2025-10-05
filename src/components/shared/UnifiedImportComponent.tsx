import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, FileText, Upload, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import SimpleImportComponent from './SimpleImportComponent';
import SimpleOFXImportComponent from './SimpleOFXImportComponent';
const UnifiedImportComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'xlsx' | 'ofx'>('xlsx');
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-6 w-6" />
                Importar Transações
              </CardTitle>
              <CardDescription>
                Importe suas transações a partir de arquivos XLSX ou OFX
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'xlsx' | 'ofx')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="xlsx" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Planilha (XLSX)
              </TabsTrigger>
              <TabsTrigger value="ofx" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Extrato (OFX)
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="xlsx" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Formato de Planilha XLSX
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                    <li>Suporta Excel e Google Sheets</li>
                    <li>Categorização automática por palavras-chave</li>
                    <li>Tags e notas opcionais</li>
                  </ul>
                </div>
              </div>
              <SimpleImportComponent />
            </TabsContent>
            
            <TabsContent value="ofx" className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-purple-900 dark:text-purple-100">
                    Formato OFX (Open Financial Exchange)
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-purple-700 dark:text-purple-300">
                    <li>Exportado diretamente de bancos</li>
                    <li>Contém dados de transações bancárias</li>
                    <li>Categorização inteligente automática</li>
                  </ul>
                </div>
              </div>
              <SimpleOFXImportComponent />
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Recursos Incluídos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Validação Automática</p>
                  <p className="text-muted-foreground">Verifica categorias e tags antes de importar</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Detecção de Duplicatas</p>
                  <p className="text-muted-foreground">Evita transações duplicadas automaticamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Atualização de Saldo</p>
                  <p className="text-muted-foreground">Saldos atualizados automaticamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Pré-visualização</p>
                  <p className="text-muted-foreground">Revise antes de confirmar a importação</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default UnifiedImportComponent;