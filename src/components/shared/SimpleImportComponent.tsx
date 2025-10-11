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
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 p-12 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-8">
          <div className="flex-1 min-w-[300px]">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full mb-6">
              <FileSpreadsheet className="h-5 w-5" />
              <span className="font-bold text-sm">Excel / Planilhas</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">Importação<br/>XLSX</h1>
            <p className="text-xl text-green-50 max-w-2xl leading-relaxed">
              Transforme suas planilhas em dados organizados em segundos
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-black mb-2">∞</div>
                <div className="text-sm text-green-50">Linhas</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2">⚡</div>
                <div className="text-sm text-green-50">Rápido</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2">🔒</div>
                <div className="text-sm text-green-50">Seguro</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2">✨</div>
                <div className="text-sm text-green-50">Fácil</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <div className={`bg-gradient-to-br from-background to-muted/30 rounded-2xl p-8 border-2 transition-all duration-300 ${file ? 'border-green-500 shadow-xl shadow-green-500/20 scale-105' : 'border-border/50'}`}>
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              1
            </div>
            <FileSpreadsheet className={`h-12 w-12 mb-4 transition-colors ${file ? 'text-green-600' : 'text-muted-foreground'}`} />
            <h3 className="text-xl font-bold mb-2">Upload do Arquivo</h3>
            <p className="text-sm text-muted-foreground mb-4">Arraste ou selecione sua planilha</p>
            {file && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20 animate-scale-in">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Arquivo carregado!</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div className={`bg-gradient-to-br from-background to-muted/30 rounded-2xl p-8 border-2 transition-all duration-300 ${selectedAccountId ? 'border-blue-500 shadow-xl shadow-blue-500/20 scale-105' : 'border-border/50'}`}>
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              2
            </div>
            <Database className={`h-12 w-12 mb-4 transition-colors ${selectedAccountId ? 'text-blue-600' : 'text-muted-foreground'}`} />
            <h3 className="text-xl font-bold mb-2">Conta de Destino</h3>
            <p className="text-sm text-muted-foreground mb-4">Escolha onde importar</p>
            {selectedAccountId && (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 animate-scale-in">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Conta selecionada!</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div className={`bg-gradient-to-br from-background to-muted/30 rounded-2xl p-8 border-2 transition-all duration-300 ${importing ? 'border-purple-500 shadow-xl shadow-purple-500/20 animate-pulse' : 'border-border/50'}`}>
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              3
            </div>
            <Upload className={`h-12 w-12 mb-4 transition-colors ${importing ? 'text-purple-600' : 'text-muted-foreground'}`} />
            <h3 className="text-xl font-bold mb-2">Processar</h3>
            <p className="text-sm text-muted-foreground mb-4">Importar transações</p>
            {importing && (
              <div className="space-y-2 animate-scale-in">
                <Progress value={progress} className="w-full h-2" />
                <span className="text-sm font-medium text-purple-600">{Math.round(progress)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Area - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Área de Upload</h3>
                  <p className="text-sm text-green-50">Solte seu arquivo aqui</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-8">
              <div
                className={`relative border-3 border-dashed rounded-3xl p-16 text-center transition-all duration-500 cursor-pointer group ${
                  isDragOver 
                    ? 'border-green-500 bg-gradient-to-br from-green-500/20 via-green-400/10 to-transparent scale-105 shadow-2xl' 
                    : 'border-muted-foreground/30 hover:border-green-500/60 hover:scale-[1.02]'
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
                  <div className="space-y-6 animate-scale-in">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-2xl">
                      <CheckCircle className="h-14 w-14 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground mb-2">{file.name}</p>
                      <p className="text-lg text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="gap-2"
                    >
                      <X className="h-5 w-5" />
                      Remover e escolher outro
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full transition-all duration-500 ${
                      isDragOver 
                        ? 'bg-gradient-to-br from-green-500 to-green-600 scale-125 rotate-12' 
                        : 'bg-gradient-to-br from-muted via-muted/60 to-muted/30 group-hover:scale-110'
                    }`}>
                      <FileSpreadsheet className={`h-16 w-16 transition-all duration-500 ${
                        isDragOver ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                      }`} />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className={`text-3xl font-black transition-all duration-300 ${
                        isDragOver ? 'text-green-600 scale-105' : 'text-foreground'
                      }`}>
                        {isDragOver ? '🎉 Solte agora!' : 'Clique ou Arraste'}
                      </h3>
                      <p className={`text-lg font-medium transition-colors ${
                        isDragOver ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        {isDragOver ? 'Vamos processar seu arquivo' : 'Arquivos .xlsx ou .xls até 10MB'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-8 pt-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isDragOver ? 'bg-green-500 animate-bounce' : 'bg-green-500/50'}`} />
                        <span className="text-xs text-muted-foreground">Rápido</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isDragOver ? 'bg-blue-500 animate-bounce' : 'bg-blue-500/50'}`} style={{ animationDelay: '75ms' }} />
                        <span className="text-xs text-muted-foreground">Seguro</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isDragOver ? 'bg-purple-500 animate-bounce' : 'bg-purple-500/50'}`} style={{ animationDelay: '150ms' }} />
                        <span className="text-xs text-muted-foreground">Automático</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={downloadTemplate}
                  className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Download className="h-4 w-4" />
                  Não tem um arquivo? Baixe nosso template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && previewData.length > 0 && (
            <Card className="border-0 shadow-xl overflow-hidden animate-fade-in">
              <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Eye className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Preview dos Dados</h3>
                      <p className="text-sm text-purple-50">Primeiras linhas do arquivo</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-muted to-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Data</th>
                        <th className="px-4 py-3 text-left font-semibold">Descrição</th>
                        <th className="px-4 py-3 text-left font-semibold">Valor</th>
                        <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3 font-medium">{row.description}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${row.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                              R$ {row.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={row.type === 'expense' ? 'destructive' : 'default'}>
                              {row.type === 'expense' ? 'Despesa' : 'Receita'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{row.category || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Settings - Right Column */}
        <div className="space-y-6">
          <Card className="border-0 shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Configurações</h3>
                  <p className="text-sm text-blue-50">Escolha a conta</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Conta de Destino
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  disabled={importing}
                  className="w-full p-4 text-base border-2 border-border rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-background text-foreground font-medium disabled:opacity-50"
                >
                  <option value="">Selecione uma conta</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.bank || 'Conta'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleImport}
                  disabled={!file || !selectedAccountId || importing}
                  className="w-full gap-2 h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Importando... {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      Importar Transações
                    </>
                  )}
                </Button>
              </div>

              {importing && (
                <Button
                  variant="outline"
                  onClick={cancelProcessing}
                  className="w-full gap-2"
                >
                  <X className="h-5 w-5" />
                  Cancelar
                </Button>
              )}
            </CardContent>
          </Card>

          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>Dica:</strong> O arquivo deve ter cabeçalhos na primeira linha (Data, Descrição, Valor, etc).
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default SimpleImportComponent;

