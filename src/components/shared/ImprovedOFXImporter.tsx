import React, { useState, useCallback, useRef } from 'react';
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
  Eye,
  FileX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useImportWorker } from '@/hooks/useImportWorker';
import { ImportedTransaction } from '@/hooks/useImport';
import { CategoryEngine } from '@/utils/categorization/CategoryEngine';
import { CategoryManager, CategoryCreationPlan } from '@/utils/categorization/CategoryManager';
import { supabase } from '@/integrations/supabase/client';

const ImprovedOFXImporter: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { insert: insertTransaction } = useSupabaseData('transactions', user?.id);
  const { processOFX, isProcessing, progress, workerAvailable } = useImportWorker();
  
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
          description: `${transactions.length} transações encontradas no preview.`,
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
  const importTransactionsWithCategories = async (
    transactions: ImportedTransaction[],
    categoryManager: CategoryManager
  ) => {
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

          const { error } = await insertTransaction({
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
          description: `${successCount} transações importadas com sucesso!`,
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
          description: `${result.created.length} novas categorias foram criadas automaticamente.`,
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

  // Preview de categorias
  if (showCategoryPreview && categoryPlan) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
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
          {categoryPlan.categoriesToCreate.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-foreground">
                Novas Categorias ({categoryPlan.categoriesToCreate.length})
              </h4>
              <div className="grid gap-3">
                {categoryPlan.categoriesToCreate.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorias mapeadas */}
          {categoryPlan.categoriesToMap.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-foreground">
                Mapeamentos ({categoryPlan.categoriesToMap.length})
              </h4>
              <div className="grid gap-3">
                {categoryPlan.categoriesToMap.map((mapping, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
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
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Button 
              onClick={handleConfirmCategoryCreation}
              disabled={isImporting}
              className="flex items-center gap-2 px-8 py-3 text-lg font-medium"
              size="lg"
            >
              {isImporting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              {isImporting ? 'Criando Categorias...' : 'Criar Categorias e Importar'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowCategoryPreview(false)}
              disabled={isImporting}
              size="lg"
              className="px-8 py-3"
            >
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (importResult) {
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
      {/* Process Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <div className={`bg-gradient-to-br from-background to-muted/30 rounded-2xl p-8 border-2 transition-all duration-300 ${file ? 'border-blue-500 shadow-xl shadow-blue-500/20 scale-105' : 'border-border/50'}`}>
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              1
            </div>
            <FileText className={`h-12 w-12 mb-4 transition-colors ${file ? 'text-blue-600' : 'text-muted-foreground'}`} />
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
          <div className={`bg-gradient-to-br from-background to-muted/30 rounded-2xl p-8 border-2 transition-all duration-300 ${(isImporting || isProcessing) ? 'border-purple-500 shadow-xl shadow-purple-500/20 animate-pulse' : 'border-border/50'}`}>
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              3
            </div>
            <Upload className={`h-12 w-12 mb-4 transition-colors ${(isImporting || isProcessing) ? 'text-purple-600' : 'text-muted-foreground'}`} />
            <h3 className="text-xl font-bold mb-2">Processar</h3>
            <p className="text-sm text-muted-foreground mb-4">Importar transações</p>
            {(isImporting || isProcessing) && (
              <div className="space-y-2 animate-scale-in">
                <Progress value={progress?.progress || 0} className="w-full h-2" />
                <span className="text-sm font-medium text-purple-600">{Math.round(progress?.progress || 0)}%</span>
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
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ofx,.ofx.txt,.txt"
                  onChange={handleFileChange}
                  className="hidden"
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
                        setShowPreview(false);
                        setPreviewData([]);
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
                      <FileText className={`h-16 w-16 transition-all duration-500 ${
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
        
        {/* Settings - Right Column */}
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
                  disabled={isImporting || isProcessing}
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
                  disabled={!file || !selectedAccountId || isImporting || isProcessing}
                  className="w-full gap-2 h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {(isImporting || isProcessing) ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Processando... {Math.round(progress?.progress || 0)}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      Importar Transações
                    </>
                  )}
                </Button>
              </div>

              {(isImporting || isProcessing) && (
                <Button
                  variant="outline"
                  onClick={handleReset}
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

export default ImprovedOFXImporter;
