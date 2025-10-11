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

  // Função para processar preview do arquivo OFX
  const handleFilePreview = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      
      // Parse básico de OFX para preview
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
              
              // Categorização básica
              let category: string | undefined;
              const descriptionLower = description.toLowerCase();
              
              if (descriptionLower.includes('mercado') || descriptionLower.includes('supermercado') || 
                  descriptionLower.includes('restaurante') || descriptionLower.includes('lanchonete')) {
                category = 'Alimentação';
              } else if (descriptionLower.includes('posto') || descriptionLower.includes('combustível') || 
                         descriptionLower.includes('uber') || descriptionLower.includes('taxi')) {
                category = 'Transporte';
              } else if (descriptionLower.includes('farmacia') || descriptionLower.includes('farmácia') || 
                         descriptionLower.includes('hospital') || descriptionLower.includes('clínica')) {
                category = 'Saúde';
              } else if (descriptionLower.includes('escola') || descriptionLower.includes('universidade') || 
                         descriptionLower.includes('curso') || descriptionLower.includes('livro')) {
                category = 'Educação';
              } else if (descriptionLower.includes('cinema') || descriptionLower.includes('teatro') || 
                         descriptionLower.includes('show') || descriptionLower.includes('viagem')) {
                category = 'Lazer';
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
    // Template OFX básico (exemplo)
    const ofxContent = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>OTHER
<DTPOST>20240115
<TRNAMT>-150.50
<FITID>123456789
<MEMO>Compra no supermercado
</STMTTRN>
<STMTTRN>
<TRNTYPE>OTHER
<DTPOST>20240116
<TRNAMT>3000.00
<FITID>987654321
<MEMO>Salário
</STMTTRN>
<STMTTRN>
<TRNTYPE>OTHER
<DTPOST>20240117
<TRNAMT>-80.00
<FITID>456789123
<MEMO>Combustível
</STMTTRN>
<STMTTRN>
<TRNTYPE>OTHER
<DTPOST>20240118
<TRNAMT>500.00
<FITID>789123456
<MEMO>Freelance
</STMTTRN>
<STMTTRN>
<TRNTYPE>OTHER
<DTPOST>20240119
<TRNAMT>-120.00
<FITID>321654987
<MEMO>Conta de luz
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
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Importação OFX Concluída
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300 font-medium">
              Importação OFX concluída com sucesso!
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
    <div className="space-y-6 animate-fade-in">
      {/* Header com informações */}
      <div className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent border border-blue-500/20 rounded-2xl p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
              <FileTextIcon className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
                Importação OFX
              </h2>
              <p className="text-base text-muted-foreground mb-4">
                Importe extratos bancários diretamente do seu banco de forma segura
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-muted-foreground">Formato .ofx/.txt</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-muted-foreground">Compatível com bancos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-muted-foreground">Categorização inteligente</span>
                </div>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="gap-2 bg-white/50 hover:bg-white"
          >
            <Download className="h-4 w-4" />
            Baixar Exemplo
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/10">
        <CardContent className="p-8 space-y-8">
        {/* Área de upload melhorada */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">1. Selecione seu arquivo OFX</h3>
          </div>
          
          <div
            className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-500 cursor-pointer overflow-hidden ${
              isDragOver 
                ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-blue-500/5 scale-[1.02] shadow-2xl shadow-blue-500/20' 
                : 'border-muted-foreground/20 hover:border-blue-500/50 hover:bg-gradient-to-br hover:from-blue-500/5 hover:to-transparent hover:shadow-lg'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('ofx-file-input')?.click()}
          >
            {/* Efeito de fundo animado */}
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 transition-transform duration-1000 ${isDragOver ? 'translate-x-full' : '-translate-x-full'}`} />
          <input
            type="file"
            accept=".ofx,.ofx.txt,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="ofx-file-input"
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
            <div className="relative z-10 space-y-6 animate-scale-in">
              <div className="flex justify-center">
                <div className={`p-8 rounded-3xl transition-all duration-500 shadow-2xl ${
                  isDragOver 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 scale-125 rotate-6' 
                    : 'bg-gradient-to-br from-muted via-muted/80 to-muted/60 hover:scale-110'
                }`}>
                  <FileTextIcon className={`h-20 w-20 transition-all duration-500 ${
                    isDragOver ? 'text-white animate-pulse' : 'text-muted-foreground'
                  }`} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className={`text-2xl font-black transition-all duration-300 ${
                  isDragOver ? 'text-blue-600 scale-105' : 'text-foreground'
                }`}>
                  {isDragOver ? '🎉 Solte aqui para processar!' : 'Arraste seu arquivo ou clique aqui'}
                </h3>
                <p className={`text-base font-medium transition-colors duration-300 ${
                  isDragOver ? 'text-blue-600' : 'text-muted-foreground'
                }`}>
                  {isDragOver ? 'Vamos processar automaticamente' : 'Suportamos arquivos .ofx e .txt (até 10MB)'}
                </p>
                {!isDragOver && (
                  <div className="flex items-center justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Banco compatível
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Seguro
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      Automático
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Preview dos dados */}
        {showPreview && previewData.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h4 className="text-lg font-semibold text-foreground">Preview dos Dados</h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Ocultar
              </Button>
            </div>
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-muted/80 to-muted/40">
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
        <div className="space-y-3">
          <label htmlFor="account-select" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Database className="h-4 w-4" />
            Conta de Destino
          </label>
          <select
            id="account-select"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={importing}
            className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-background text-foreground"
          >
            <option value="">Selecione uma conta para importar as transações</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} - {account.bank || 'Conta'}
              </option>
            ))}
          </select>
        </div>

        {/* Informações sobre o formato */}
        <Alert className="bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-foreground">
            <strong>Formato OFX:</strong> Arquivo de extrato bancário no formato OFX (Open Financial Exchange). 
            O sistema detecta automaticamente transações e aplica categorização inteligente baseada na descrição.
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
            Baixar Template OFX
          </Button>
        </div>

        {/* Progresso do processamento */}
        {importing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando transações OFX...
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
            {importing ? 'Importando...' : 'Importar Transações OFX'}
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
    </div>
  );
};

export default SimpleOFXImportComponent;
