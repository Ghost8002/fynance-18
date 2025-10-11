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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar Transações</CardTitle>
          <CardDescription>
            Importe suas transações de arquivos XLSX ou OFX
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'xlsx' | 'ofx')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="xlsx">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Planilha (XLSX)
              </TabsTrigger>
              <TabsTrigger value="ofx">
                <FileText className="h-4 w-4 mr-2" />
                OFX
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="xlsx" className="mt-4">
              <SimpleImportComponent />
            </TabsContent>
            
            <TabsContent value="ofx" className="mt-4">
              <SimpleOFXImportComponent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
export default UnifiedImportComponent;