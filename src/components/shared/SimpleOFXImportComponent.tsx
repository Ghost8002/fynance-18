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
  FileText as FileTextIcon,
  Eye
} from 'lucide-react';
import { useOFXImport } from '@/hooks/useOFXImport';
import { ImportedTransaction } from '@/hooks/useImport';
import { useImportWorker } from '@/hooks/useImportWorker';

const SimpleOFXImportComponent: React.FC = () => {
  const { importing, progress, result, accounts, importFile, reset, cancelProcessing } = useOFXImport();
  const { workerAvailable } = useImportWorker();
  
  const [file, setFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedTransaction[]>([]);

  const handleFilePreview = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      const transactions: ImportedTransaction[] = [];
      const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
      let match;
      let count = 0;
      
      while ((match = transactionRegex.exec(text)) !== null && count < 5) {
        const transactionBlock = match[1];
        
        try {
          const dateMatch = transactionBlock.match(/<DTPOST>(\d{8})<\/DTPOST>/);
          const amountMatch = transactionBlock.match(/<TRNAMT>([^<]+)<\/TRNAMT>/);
          const memoMatch = transactionBlock.match(/<MEMO>([^<]+)<\/MEMO>/);
          
          if (dateMatch && amountMatch && memoMatch) {
            const dateStr = dateMatch[1];
            const amount = parseFloat(amountMatch[1]);
            const description = memoMatch[1].trim();
            
            if (!isNaN(amount) && description) {
              const year = dateStr.substring(0, 4);
              const month = dateStr.substring(4, 6);
              const day = dateStr.substring(6, 8);
              const date = `${year}-${month}-${day}`;
              
              const type: 'income' | 'expense' = amount > 0 ? 'income' : 'expense';
              
              let category: string | undefined;
              const descriptionLower = description.toLowerCase();
              
              if (descriptionLower.includes('mercado') || descriptionLower.includes('supermercado')) {
                category = 'Alimentação';
              } else if (descriptionLower.includes('posto') || descriptionLower.includes('combustível')) {
                category = 'Transporte';
              }
              
              transactions.push({
                date,
                description,
                amount: Math.abs(amount),
                type,
                category,
                tags: []
              });
              
              count++;
            }
          }
        } catch (error) {
          console.warn('Erro ao processar transação OFX para preview:', error);
          continue;
        }
      }
      
      setPreviewData(transactions);
      setShowPreview(true);
    } catch (error) {
      console.error('Erro ao gerar preview OFX:', error);
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
    const isOFX = fileName.endsWith('.ofx') || fileName.endsWith('.ofx.txt');
    
    if (!isOFX) {
      alert('Por favor, selecione um arquivo OFX válido (.ofx ou .ofx.txt).');
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
      console.error('Erro na importação OFX:', error);
    }
  }, [file, selectedAccountId, importFile]);

  const handleReset = useCallback(() => {
    setFile(null);
    setSelectedAccountId('');
    setShowPreview(false);
    setPreviewData([]);
    reset();
  }, [reset]);

  const downloadTemplate = useCallback(() => {
    const ofxContent = `OFXHEADER:100
DATA:OFXSGML
VERSION:102

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>OTHER
<DTPOST>20240115
<TRNAMT>-150.50
<MEMO>Exemplo de transação
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
    
    const blob = new Blob([ofxContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_extrato.ofx');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (result) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <CheckCircle className="h-6 w-6" />
            Importação OFX Concluída
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-700 dark:text-blue-300 font-medium">
              Importação OFX concluída com sucesso!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-6 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-center border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{result.success}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Importadas</div>
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
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600 p-12 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-8">
          <div className="flex-1 min-w-[300px]">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full mb-6">
              <FileTextIcon className="h-5 w-5" />
              <span className="font-bold text-sm">Extratos Bancários</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">Importação<br/>OFX</h1>
            <p className="text-xl text-blue-50 max-w-2xl leading-relaxed">
              Importe extratos do seu banco de forma rápida e segura
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-black mb-2">🏦</div>
                <div className="text-sm text-blue-50">Bancos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2">⚡</div>
                <div className="text-sm text-blue-50">Rápido</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2">🔒</div>
                <div className="text-sm text-blue-50">Seguro</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2">🤖</div>
                <div className="text-sm text-blue-50">Auto</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <div className={`bg-gradient-to-br from-background to-muted/30 rounded-2xl p-8 border-2 transition-all duration-300 ${file ? 'border-blue-500 shadow-xl shadow-blue-500/20 scale-105' : 'border-border/50'}`}>
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              1
            </div>
            <FileTextIcon className={`h-12 w-12 mb-4 transition-colors ${file ? 'text-blue-600' : 'text-muted-foreground'}`} />
            <h3 className="text-xl font-bold mb-2">Upload do OFX</h3>
            <p className="text-sm text-muted-foreground mb-4">Arquivo do seu banco</p>
            {file && (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 animate-scale-in">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Arquivo carregado!</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div className={`bg-gradient-to-br from-background to-muted/30 rounded-2xl p-8 border-2 transition-all duration-300 ${selectedAccountId ? 'border-green-500 shadow-xl shadow-green-500/20 scale-105' : 'border-border/50'}`}>
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              2
            </div>
            <Database className={`h-12 w-12 mb-4 transition-colors ${selectedAccountId ? 'text-green-600' : 'text-muted-foreground'}`} />
            <h3 className="text-xl font-bold mb-2">Conta de Destino</h3>
            <p className="text-sm text-muted-foreground mb-4">Escolha onde importar</p>
            {selectedAccountId && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20 animate-scale-in">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Conta selecionada!</span>
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
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Área de Upload</h3>
                  <p className="text-sm text-blue-50">Solte seu arquivo OFX aqui</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-8">
              <div
                className={`relative border-3 border-dashed rounded-3xl p-16 text-center transition-all duration-500 cursor-pointer group ${
                  isDragOver 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent scale-105 shadow-2xl' 
                    : 'border-muted-foreground/30 hover:border-blue-500/60 hover:scale-[1.02]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('ofx-file-input')?.click()}
              >
                <input
                  type="file"
                  accept=".ofx,.ofx.txt,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="ofx-file-input"
                />
                
                {file ? (
                  <div className="space-y-6 animate-scale-in">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl">
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
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 scale-125 rotate-12' 
                        : 'bg-gradient-to-br from-muted via-muted/60 to-muted/30 group-hover:scale-110'
                    }`}>
                      <FileTextIcon className={`h-16 w-16 transition-all duration-500 ${
                        isDragOver ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                      }`} />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className={`text-3xl font-black transition-all duration-300 ${
                        isDragOver ? 'text-blue-600 scale-105' : 'text-foreground'
                      }`}>
                        {isDragOver ? '🎉 Solte agora!' : 'Clique ou Arraste'}
                      </h3>
                      <p className={`text-lg font-medium transition-colors ${
                        isDragOver ? 'text-blue-600' : 'text-muted-foreground'
                      }`}>
                        {isDragOver ? 'Vamos processar seu extrato' : 'Arquivos .ofx ou .txt até 10MB'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-8 pt-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isDragOver ? 'bg-blue-500 animate-bounce' : 'bg-blue-500/50'}`} />
                        <span className="text-xs text-muted-foreground">Compatível</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isDragOver ? 'bg-green-500 animate-bounce' : 'bg-green-500/50'}`} style={{ animationDelay: '75ms' }} />
                        <span className="text-xs text-muted-foreground">Seguro</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isDragOver ? 'bg-purple-500 animate-bounce' : 'bg-purple-500/50'}`} style={{ animationDelay: '150ms' }} />
                        <span className="text-xs text-muted-foreground">Rápido</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={downloadTemplate}
                  className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4" />
                  Baixar exemplo de arquivo OFX
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
                      <p className="text-sm text-purple-50">Primeiras transações encontradas</p>
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
        
        {/* Settings */}
        <div className="space-y-6">
          <Card className="border-0 shadow-xl">
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Configurações</h3>
                  <p className="text-sm text-green-50">Escolha a conta</p>
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
                  className="w-full p-4 text-base border-2 border-border rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-background text-foreground font-medium disabled:opacity-50"
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
                  className="w-full gap-2 h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
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
              <strong>Dica:</strong> Baixe o arquivo OFX diretamente do site do seu banco na área de extratos.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default SimpleOFXImportComponent;
