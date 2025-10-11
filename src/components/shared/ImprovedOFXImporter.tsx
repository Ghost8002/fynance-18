import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, X, Download, Info, Database, Eye, FileX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useImportWorker } from '@/hooks/useImportWorker';
import { ImportedTransaction } from '@/hooks/useImport';
import { CategoryEngine } from '@/utils/categorization/CategoryEngine';
import { CategoryManager, CategoryCreationPlan } from '@/utils/categorization/CategoryManager';
import { supabase } from '@/integrations/supabase/client';
import { AccountSelector } from './AccountSelector';
const ImprovedOFXImporter: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    data: accounts
  } = useSupabaseData('accounts', user?.id);
  const {
    insert: insertTransaction
  } = useSupabaseData('transactions', user?.id);
  const {
    processOFX,
    isProcessing,
    progress,
    workerAvailable
  } = useImportWorker();
  const [file, setFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedTransaction[]>([]);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: number;
    total: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [categoryPlan, setCategoryPlan] = useState<CategoryCreationPlan | null>(null);
  const [showCategoryPreview, setShowCategoryPreview] = useState(false);
  const [processedTransactions, setProcessedTransactions] = useState<ImportedTransaction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Instância do motor de categorização para preview
  const categoryEngineRef = useRef<CategoryEngine | null>(null);

  // Inicializar motor de categorização
  const getCategoryEngine = useCallback(() => {
    if (!categoryEngineRef.current) {
      categoryEngineRef.current = new CategoryEngine({
        minConfidence: 70,
        enableLearning: true
      });
    }
    return categoryEngineRef.current;
  }, []);

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
      while ((match = transactionRegex.exec(text)) !== null && count < 10) {
        const transactionBlock = match[1];
        try {
          // Suportar tanto DTPOST quanto DTPOSTED - capturar apenas os primeiros 8 dígitos da data
          const dateMatch = transactionBlock.match(/<DTPOST(?:ED)?>(\d{8})/);
          const amountMatch = transactionBlock.match(/<TRNAMT>([^<]+)<\/TRNAMT>/);
          const memoMatch = transactionBlock.match(/<MEMO>([^<]+)<\/MEMO>/);
          const nameMatch = transactionBlock.match(/<NAME>([^<]+)<\/NAME>/);
          const checkNumMatch = transactionBlock.match(/<CHECKNUM>([^<]+)<\/CHECKNUM>/);

          // Suportar TRNTYPE para determinar tipo de transação
          const trnTypeMatch = transactionBlock.match(/<TRNTYPE>([^<]+)<\/TRNTYPE>/);
          if (dateMatch && amountMatch) {
            const dateStr = dateMatch[1];
            const amount = parseFloat(amountMatch[1]);

            // Usar MEMO, NAME ou CHECKNUM como descrição
            let description = '';
            if (memoMatch) {
              description = memoMatch[1].trim();
            } else if (nameMatch) {
              description = nameMatch[1].trim();
            } else if (checkNumMatch) {
              description = `Cheque ${checkNumMatch[1].trim()}`;
            } else {
              description = 'Transação sem descrição';
            }
            if (!isNaN(amount) && description && amount !== 0) {
              const year = dateStr.substring(0, 4);
              const month = dateStr.substring(4, 6);
              const day = dateStr.substring(6, 8);
              const date = `${year}-${month}-${day}`;

              // Determinar tipo baseado no TRNTYPE ou valor
              let type: 'income' | 'expense' = 'expense';
              if (trnTypeMatch) {
                const trnType = trnTypeMatch[1].toUpperCase();
                if (trnType === 'CREDIT' || trnType === 'DEP' || trnType === 'DEPOSIT') {
                  type = 'income';
                } else if (trnType === 'DEBIT' || trnType === 'WITHDRAWAL' || trnType === 'PAYMENT') {
                  type = 'expense';
                } else {
                  // Fallback para valor
                  type = amount > 0 ? 'income' : 'expense';
                }
              } else {
                // Fallback para valor se não houver TRNTYPE
                type = amount > 0 ? 'income' : 'expense';
              }

              // Categorização inteligente usando o novo sistema
              const engine = getCategoryEngine();
              const categorization = engine.categorize({
                date,
                description,
                amount: Math.abs(amount),
                type,
                category: undefined,
                tags: []
              });
              const category = categorization?.category;
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
      if (transactions.length === 0) {
        toast({
          title: "Nenhuma transação encontrada",
          description: "O arquivo OFX não contém transações válidas ou está em formato não suportado.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Preview gerado",
          description: `${transactions.length} transações encontradas no preview.`
        });
      }
    } catch (error) {
      console.error('Erro ao gerar preview OFX:', error);
      toast({
        title: "Erro no preview",
        description: "Não foi possível processar o arquivo para preview.",
        variant: "destructive"
      });
    }
  }, [toast]);
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
    const isOFX = fileName.endsWith('.ofx') || fileName.endsWith('.ofx.txt') || fileName.endsWith('.txt');
    if (!isOFX) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo OFX válido (.ofx, .ofx.txt ou .txt).",
        variant: "destructive"
      });
      return;
    }
    setFile(selectedFile);
    handleFilePreview(selectedFile);
  }, [handleFilePreview, toast]);
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
    if (!file || !selectedAccountId) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um arquivo OFX e uma conta de destino.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsImporting(true);
      setImportResult(null);
      console.log('Iniciando importação OFX...');
      const transactions = await processOFX(file);
      console.log('Transações processadas:', transactions);
      if (transactions.length === 0) {
        toast({
          title: "Nenhuma transação válida",
          description: "O arquivo OFX não contém transações válidas.",
          variant: "destructive"
        });
        setIsImporting(false);
        return;
      }

      // Analisar e criar categorias necessárias
      const categoryManager = new CategoryManager(supabase, user!.id);
      console.log('Analisando categorias necessárias...');
      const plan = await categoryManager.analyzeCategories(transactions);
      if (plan.totalNewCategories > 0 || plan.totalMappedCategories > 0) {
        // Mostrar preview das categorias
        setCategoryPlan(plan);
        setProcessedTransactions(transactions);
        setShowCategoryPreview(true);
        setIsImporting(false);
        return;
      }

      // Se não há categorias para criar, importar diretamente
      await importTransactionsWithCategories(transactions, categoryManager);
    } catch (error) {
      console.error('Erro na importação OFX:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido ao importar arquivo OFX.",
        variant: "destructive"
      });
      setIsImporting(false);
    }
  }, [file, selectedAccountId, processOFX, insertTransaction, user, toast]);

  // Função para importar transações com categorias
  const importTransactionsWithCategories = async (transactions: ImportedTransaction[], categoryManager: CategoryManager) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      for (const transaction of transactions) {
        try {
          // Obter ID da categoria
          let categoryId: string | null = null;
          if (transaction.category) {
            categoryId = await categoryManager.getCategoryId(transaction.category);
          }
          const {
            error
          } = await insertTransaction({
            user_id: user!.id,
            type: transaction.type,
            description: transaction.description,
            amount: transaction.type === 'expense' ? -transaction.amount : transaction.amount,
            category_id: categoryId,
            account_id: selectedAccountId,
            date: transaction.date,
            notes: `Importado de OFX`,
            tags: transaction.tags || []
          });
          if (error) {
            console.error('Erro ao inserir transação:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
          errorCount++;
        }
      }
      setImportResult({
        success: successCount,
        errors: errorCount,
        total: transactions.length
      });
      if (successCount > 0) {
        toast({
          title: "Importação concluída",
          description: `${successCount} transações importadas com sucesso!`
        });
      } else {
        toast({
          title: "Erro na importação",
          description: "Nenhuma transação foi importada.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao importar transações:', error);
      toast({
        title: "Erro na importação",
        description: "Erro ao importar transações.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Função para confirmar criação de categorias
  const handleConfirmCategoryCreation = useCallback(async () => {
    if (!categoryPlan || !processedTransactions.length) return;
    try {
      setIsImporting(true);
      setShowCategoryPreview(false);
      const categoryManager = new CategoryManager(supabase, user!.id);
      console.log('Criando categorias...');
      const result = await categoryManager.executeCategoryPlan(categoryPlan);
      console.log('Categorias criadas:', result.created.length);
      console.log('Categorias mapeadas:', result.mapped.length);
      if (result.errors.length > 0) {
        console.warn('Erros na criação de categorias:', result.errors);
      }

      // Importar transações com as categorias criadas
      await importTransactionsWithCategories(processedTransactions, categoryManager);

      // Mostrar resultado das categorias criadas
      if (result.created.length > 0) {
        toast({
          title: "Categorias criadas",
          description: `${result.created.length} novas categorias foram criadas automaticamente.`
        });
      }
    } catch (error) {
      console.error('Erro ao criar categorias:', error);
      toast({
        title: "Erro na criação de categorias",
        description: "Erro ao criar categorias necessárias.",
        variant: "destructive"
      });
      setIsImporting(false);
    }
  }, [categoryPlan, processedTransactions, user, toast, selectedAccountId, insertTransaction]);
  const handleReset = useCallback(() => {
    setFile(null);
    setSelectedAccountId('');
    setShowPreview(false);
    setPreviewData([]);
    setImportResult(null);
    setCategoryPlan(null);
    setShowCategoryPreview(false);
    setProcessedTransactions([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
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
    const blob = new Blob([ofxContent], {
      type: 'text/plain;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_extrato.ofx');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Preview de categorias
  if (showCategoryPreview && categoryPlan) {
    return <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Database className="h-6 w-6" />
            Categorias Necessárias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-700 dark:text-blue-300 font-medium">
              O sistema identificou categorias que precisam ser criadas para organizar suas transações.
            </AlertDescription>
          </Alert>

          {/* Categorias a serem criadas */}
          {categoryPlan.categoriesToCreate.length > 0 && <div className="space-y-3">
              <h4 className="text-lg font-semibold text-foreground">
                Novas Categorias ({categoryPlan.categoriesToCreate.length})
              </h4>
              <div className="grid gap-3">
                {categoryPlan.categoriesToCreate.map((category, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{
                  backgroundColor: category.color
                }} />
                      <div>
                        <div className="font-medium text-foreground">{category.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {category.type === 'income' ? 'Receita' : 'Despesa'} • {category.reason}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {category.type === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </div>)}
              </div>
            </div>}

          {/* Categorias mapeadas */}
          {categoryPlan.categoriesToMap.length > 0 && <div className="space-y-3">
              <h4 className="text-lg font-semibold text-foreground">
                Mapeamentos ({categoryPlan.categoriesToMap.length})
              </h4>
              <div className="grid gap-3">
                {categoryPlan.categoriesToMap.map((mapping, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                      <div>
                        <div className="font-medium text-foreground">
                          {mapping.suggested} → {mapping.existing}
                        </div>
                        <div className="text-sm text-muted-foreground">{mapping.reason}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">Mapeado</Badge>
                  </div>)}
              </div>
            </div>}

          <div className="flex justify-center gap-3">
            <Button onClick={handleConfirmCategoryCreation} disabled={isImporting} className="flex items-center gap-2 px-8 py-3 text-lg font-medium" size="lg">
              {isImporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              {isImporting ? 'Criando Categorias...' : 'Criar Categorias e Importar'}
            </Button>
            
            <Button variant="outline" onClick={() => setShowCategoryPreview(false)} disabled={isImporting} size="lg" className="px-8 py-3">
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  if (importResult) {
    return <Card className="w-full max-w-4xl mx-auto">
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
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{importResult.success}</div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">Importadas</div>
            </div>
            <div className="p-6 bg-red-50 dark:bg-red-950/50 rounded-xl text-center border border-red-200 dark:border-red-800">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{importResult.errors}</div>
              <div className="text-sm text-red-700 dark:text-red-300 font-medium">Erros</div>
            </div>
            <div className="p-6 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-center border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{importResult.total}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total</div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={handleReset} className="flex items-center gap-2 px-8 py-3 text-lg font-medium" size="lg">
              <Download className="h-5 w-5" />
              Importar Outro Arquivo
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Importar Transações OFX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de upload */}
        <div className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${isDragOver ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' : 'border-border hover:border-blue-500/50'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept=".ofx,.ofx.txt,.txt" onChange={handleFileChange} className="hidden" />
          
          {file ? <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="h-12 w-12 text-blue-500" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={e => {
            e.stopPropagation();
            setFile(null);
            setShowPreview(false);
            setPreviewData([]);
          }} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Remover Arquivo
              </Button>
            </div> : <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`p-4 rounded-full transition-colors duration-300 ${isDragOver ? 'bg-blue-500/10 dark:bg-blue-500/20' : 'bg-muted/50 dark:bg-muted'}`}>
                  <FileText className={`h-12 w-12 transition-colors duration-300 ${isDragOver ? 'text-blue-600' : 'text-muted-foreground'}`} />
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${isDragOver ? 'text-blue-600' : 'text-foreground'}`}>
                  {isDragOver ? 'Solte o arquivo aqui' : 'Selecione um arquivo OFX'}
                </h3>
                <p className={`text-sm mt-2 transition-colors duration-300 ${isDragOver ? 'text-blue-600/80' : 'text-muted-foreground'}`}>
                  {isDragOver ? 'Arquivo será processado automaticamente' : 'ou arraste e solte aqui'}
                </p>
              </div>
            </div>}
        </div>

        {/* Preview dos dados */}
        {showPreview && previewData.length > 0 && <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-foreground">Preview dos Dados</h4>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
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
                  {previewData.map((row, index) => <tr key={index} className="border-t">
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
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>}

        {/* Seleção de conta */}
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelect={setSelectedAccountId}
          disabled={isImporting || isProcessing}
          colorScheme="blue"
        />

        {/* Informações sobre o formato */}
        

        {/* Status do Web Worker */}
        

        {/* Botão para download do template */}
        <div className="flex justify-center">
          
        </div>

        {/* Progresso do processamento */}
        {(isImporting || isProcessing) && <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isImporting ? 'Importando transações...' : 'Processando arquivo OFX...'}
              </span>
              <span className="font-medium text-foreground">{Math.round(progress?.progress || 0)}%</span>
            </div>
            <Progress value={progress?.progress || 0} className="w-full h-2" />
          </div>}

        {/* Botões de ação */}
        <div className="flex gap-3 justify-center">
          <Button onClick={handleImport} disabled={!file || !selectedAccountId || isImporting || isProcessing} className="flex items-center gap-2 px-8 py-3 text-lg font-medium" size="lg">
            {isImporting || isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {isImporting || isProcessing ? 'Processando...' : 'Importar Transações OFX'}
          </Button>
          
          <Button variant="outline" onClick={handleReset} disabled={isImporting || isProcessing} size="lg" className="px-8 py-3">
            <X className="h-5 w-5 mr-2" />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>;
};
export default ImprovedOFXImporter;