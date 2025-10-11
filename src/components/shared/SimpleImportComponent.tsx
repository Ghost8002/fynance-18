import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  X, 
  Download,
  Info,
  Database,
  FileSpreadsheet,
  Eye,
  Edit
} from 'lucide-react';
import { useImport, ImportedTransaction } from '@/hooks/useImport';
import { useImportWorker } from '@/hooks/useImportWorker';
import { AccountSelector } from './AccountSelector';

const SimpleImportComponent: React.FC = () => {
  const { importing, progress, result, accounts, importFile, reset, cancelProcessing } = useImport();
  const { workerAvailable } = useImportWorker();
  
  const [file, setFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedTransaction[]>([]);

  // Função para processar preview do arquivo
  const handleFilePreview = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) return;
      
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1, 6); // Primeiras 5 linhas
      
      // Mapeamento automático simples
      const columnMapping = {
        date: headers.findIndex(h => h.toLowerCase().includes('data') || h.toLowerCase().includes('date')),
        description: headers.findIndex(h => h.toLowerCase().includes('desc') || h.toLowerCase().includes('memo')),
        amount: headers.findIndex(h => h.toLowerCase().includes('valor') || h.toLowerCase().includes('amount')),
        type: headers.findIndex(h => h.toLowerCase().includes('tipo') || h.toLowerCase().includes('type')),
        category: headers.findIndex(h => h.toLowerCase().includes('categoria') || h.toLowerCase().includes('category')),
        tags: headers.findIndex(h => h.toLowerCase().includes('tag') || h.toLowerCase().includes('etiqueta'))
      };

      const preview: ImportedTransaction[] = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        if (!row || row.length === 0) continue;

        const date = columnMapping.date >= 0 ? String(row[columnMapping.date] || '') : '';
        const description = columnMapping.description >= 0 ? String(row[columnMapping.description] || '') : '';
        const amountStr = columnMapping.amount >= 0 ? String(row[columnMapping.amount] || '') : '';
        
        if (date && description && amountStr) {
          const amount = parseFloat(amountStr.replace(/[R$\s]/g, '').replace(',', '.'));
          if (!isNaN(amount) && amount !== 0) {
            preview.push({
              date,
              description: description.trim(),
              amount: Math.abs(amount),
              type: amount > 0 ? 'income' : 'expense',
              category: columnMapping.category >= 0 ? String(row[columnMapping.category] || '') : undefined,
              tags: columnMapping.tags >= 0 ? String(row[columnMapping.tags] || '').split(',').map(t => t.trim()).filter(t => t) : []
            });
          }
        }
      }
      
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleFilePreview(selectedFile);
    }
  }, [handleFilePreview]);

  const handleFileSelection = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isXLSX) {
      alert('Por favor, selecione um arquivo XLSX ou XLS válido.');
      return;
    }

    setFile(selectedFile);
    handleFilePreview(selectedFile);
  }, [handleFilePreview]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelection(droppedFile);
  }, [handleFileSelection]);

  const handleImport = useCallback(async () => {
    if (!file || !selectedAccountId) return;
    
    try {
      await importFile(file, selectedAccountId);
    } catch (error) {
      console.error('Erro na importação:', error);
    }
  }, [file, selectedAccountId, importFile]);

  const handleReset = useCallback(() => {
    setFile(null);
    setSelectedAccountId('');
    setShowPreview(false);
    setPreviewData([]);
    reset();
  }, [reset]);

  const downloadTemplate = useCallback(async () => {
    try {
      // Importar XLSXProcessor dinamicamente
      const { XLSXProcessor } = await import('@/utils/xlsxProcessor');
      
      // Criar template XLSX simples
      const template = XLSXProcessor.createSimpleTemplate();
      
      // Gerar arquivo para download
      XLSXProcessor.generateXLSXFile(template, 'template_transacoes.xlsx');
      
    } catch (error) {
      console.error('Erro ao gerar template XLSX:', error);
      // Fallback para CSV se houver erro
      const csvContent = `Data,Descrição,Valor,Tipo,Categoria,Tags
15/01/2024,Compra no supermercado,-150.50,Despesa,Alimentação,compras;mercado
16/01/2024,Salário,3000.00,Receita,Salário,trabalho;renda
17/01/2024,Combustível,-80.00,Despesa,Transporte,carro;posto`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'template_transacoes.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  if (result) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Importação Concluída
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300 font-medium">
              Importação concluída com sucesso!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-6 bg-green-50 dark:bg-green-950/50 rounded-xl text-center border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{result.success}</div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">Importadas</div>
            </div>
            <div className="p-6 bg-red-50 dark:bg-red-950/50 rounded-xl text-center border border-red-200 dark:border-red-800">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{result.errors}</div>
              <div className="text-sm text-red-700 dark:text-red-300 font-medium">Erros</div>
            </div>
            <div className="p-6 bg-yellow-50 dark:bg-yellow-950/50 rounded-xl text-center border border-yellow-200 dark:border-yellow-800">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{result.duplicates}</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Duplicatas</div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button 
              onClick={handleReset} 
              className="flex items-center gap-2 px-8 py-3 text-lg font-medium"
              size="lg"
            >
              <Download className="h-5 w-5" />
              Importar Outro Arquivo
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-8 py-3"
              size="lg"
            >
              <Eye className="h-5 w-5" />
              Ver Transações Importadas
            </Button>
          </div>

          {showPreview && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transações Importadas</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Data</th>
                      <th className="px-3 py-2 text-left font-medium">Descrição</th>
                      <th className="px-3 py-2 text-left font-medium">Valor</th>
                      <th className="px-3 py-2 text-left font-medium">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium">Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.transactions.slice(0, 10).map((transaction, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">{transaction.date}</td>
                        <td className="px-3 py-2">{transaction.description}</td>
                        <td className="px-3 py-2">
                          <span className={transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                            R$ {transaction.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={transaction.type === 'expense' ? 'destructive' : 'default'}>
                            {transaction.type === 'expense' ? 'Despesa' : 'Receita'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{transaction.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.transactions.length > 10 && (
                  <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                    Mostrando 10 de {result.transactions.length} transações
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Importar Transações XLSX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de upload */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
            isDragOver 
              ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' 
              : 'border-border hover:border-blue-500/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          
          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="h-12 w-12 text-blue-500" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setFile(null)}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Remover Arquivo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`p-4 rounded-full transition-colors duration-300 ${
                  isDragOver 
                    ? 'bg-blue-500/10 dark:bg-blue-500/20' 
                    : 'bg-muted/50 dark:bg-muted'
                }`}>
                  <FileSpreadsheet className={`h-12 w-12 transition-colors duration-300 ${
                    isDragOver ? 'text-blue-600' : 'text-muted-foreground'
                  }`} />
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDragOver ? 'text-blue-600' : 'text-foreground'
                }`}>
                  {isDragOver ? 'Solte o arquivo aqui' : 'Selecione um arquivo XLSX'}
                </h3>
                <p className={`text-sm mt-2 transition-colors duration-300 ${
                  isDragOver ? 'text-blue-600/80' : 'text-muted-foreground'
                }`}>
                  {isDragOver ? 'Arquivo será processado automaticamente' : 'ou arraste e solte aqui'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview dos dados */}
        {showPreview && previewData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-foreground">Preview dos Dados</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Ocultar
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Data</th>
                    <th className="px-3 py-2 text-left font-medium">Descrição</th>
                    <th className="px-3 py-2 text-left font-medium">Valor</th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium">Categoria</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2">{row.description}</td>
                      <td className="px-3 py-2">
                        <span className={row.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                          R$ {row.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={row.type === 'expense' ? 'destructive' : 'default'}>
                          {row.type === 'expense' ? 'Despesa' : 'Receita'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{row.category || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Seleção de conta */}
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelect={setSelectedAccountId}
          disabled={importing}
          colorScheme="blue"
        />

        {/* Informações sobre o formato */}
        <Alert className="bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-foreground">
            <strong>Formato XLSX:</strong> O arquivo deve ter uma primeira linha com cabeçalhos 
            (Data, Descrição, Valor, Tipo, Categoria, Tags). Apenas Data, Descrição e Valor são obrigatórios. 
            Use o template XLSX para garantir o formato correto.
          </AlertDescription>
        </Alert>

        {/* Status do Web Worker */}
        <Alert className={workerAvailable ? "bg-green-500/5 dark:bg-green-500/10 border-green-500/20" : "bg-yellow-500/5 dark:bg-yellow-500/10 border-yellow-500/20"}>
          {workerAvailable ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription className="text-foreground">
            <strong>Processamento:</strong> {workerAvailable ? 'Web Worker ativo (processamento assíncrono)' : 'Modo fallback (processamento síncrono)'}
          </AlertDescription>
        </Alert>

        {/* Botão para download do template */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar Template XLSX
          </Button>
        </div>

        {/* Progresso do processamento */}
        {importing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando transações...
              </span>
              <span className="font-medium text-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full h-2" />
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleImport}
            disabled={!file || !selectedAccountId || importing}
            className="flex items-center gap-2 px-8 py-3 text-lg font-medium"
            size="lg"
          >
            {importing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            {importing ? 'Importando...' : 'Importar Transações'}
          </Button>
          
          {importing && (
            <Button 
              variant="outline" 
              onClick={cancelProcessing}
              size="lg"
              className="px-8 py-3"
            >
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={importing}
            size="lg"
            className="px-8 py-3"
          >
            <X className="h-5 w-5 mr-2" />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleImportComponent;
