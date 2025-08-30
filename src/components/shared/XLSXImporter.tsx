import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  X, 
  FileX, 
  Download,
  Info,
  Clock,
  Database,
  Users,
  TrendingUp,
  Settings,
  Table,
  FileSpreadsheet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import XLSXDataTreatment from "./XLSXDataTreatment";
import XLSXValidationModal from "./XLSXValidationModal";
import { XLSXProcessor, XLSXTemplate, XLSXTransaction, CategoryMapping } from "@/utils/xlsxProcessor";
import * as XLSX from 'xlsx';

interface ImportedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  tags?: string[];
  reference?: string;
}

interface TreatedTransaction extends ImportedTransaction {
  id: string;
  category_id?: string;
  tags: string[];
  selected: boolean;
}

const XLSXImporter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: existingCategories } = useSupabaseData('categories', user?.id);
  const { insert: insertTransaction } = useSupabaseData('transactions', user?.id);
  const { updateAccountBalance } = useBalanceUpdates();
  
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedTransactions, setImportedTransactions] = useState<ImportedTransaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [showDataTreatment, setShowDataTreatment] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    errors: number;
    duplicates: number;
  } | null>(null);

  // Novo sistema de processamento
  const [processor] = useState(() => new XLSXProcessor());
  const [template, setTemplate] = useState<XLSXTemplate | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Mapeamento de colunas (legado)
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelection(selectedFile);
  };

  const processXLSXPreview = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Pegar a primeira planilha
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error('Arquivo XLSX vazio');
      }
      
      // Pegar as primeiras 5 linhas para preview
      const previewLines = jsonData.slice(0, 5);
      
      // Converter para formato de array de strings
      const previewData = previewLines.map((row: any) => 
        Array.isArray(row) ? row.map(cell => String(cell || '')) : []
      );
      
      setPreviewData(previewData);
      
      if (previewData.length > 0) {
        // Usar primeira linha como cabeçalho
        const headers = previewData[0];
        setAvailableColumns(headers);
        
        // Mapeamento automático baseado em nomes de colunas
        const autoMapping: { [key: string]: string } = {};
        headers.forEach((col: string) => {
          const colLower = col.toLowerCase();
          if (colLower.includes('data') || colLower.includes('date')) {
            autoMapping[col] = 'date';
          } else if (colLower.includes('desc') || colLower.includes('memo') || colLower.includes('obs')) {
            autoMapping[col] = 'description';
          } else if (colLower.includes('valor') || colLower.includes('amount') || colLower.includes('montante')) {
            autoMapping[col] = 'amount';
          } else if (colLower.includes('tipo') || colLower.includes('type')) {
            autoMapping[col] = 'type';
          } else if (colLower.includes('categoria') || colLower.includes('category')) {
            autoMapping[col] = 'category';
          } else if (colLower.includes('tag') || colLower.includes('etiqueta')) {
            autoMapping[col] = 'tags';
          }
        });
        setColumnMapping(autoMapping);
      }
    } catch (error) {
      console.error('Erro ao processar preview XLSX:', error);
      toast({
        title: "Erro no Preview",
        description: "Não foi possível processar o preview do arquivo XLSX.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelection = (selectedFile: File | null) => {
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      
      if (isXLSX) {
        setFile(selectedFile);
        setResults(null);
        setImportedTransactions([]);
        setShowDataTreatment(false);
        setPreviewData([]);
        setAvailableColumns([]);
        setColumnMapping({});
        
        // Processar preview do arquivo
        processXLSXPreview(selectedFile);
        
        toast({
          title: "Arquivo Selecionado",
          description: `${selectedFile.name} foi carregado com sucesso.`,
        });
      } else {
        toast({
          title: "Arquivo Inválido",
          description: "Por favor, selecione um arquivo XLSX ou XLS válido.",
          variant: "destructive",
        });
      }
    }
  };

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
  }, []);



  const processXLSXFile = async (file: File): Promise<ImportedTransaction[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Pegar a primeira planilha
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error('Arquivo XLSX vazio');
      }
      
      // Usar primeira linha como cabeçalho
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);
      
      const transactions: ImportedTransaction[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        
        if (!row || row.length < 3) continue; // Linha muito curta, ignorar

        try {
          // Extrair dados baseado no mapeamento
          const date = getCellValue(row, headers, 'date');
          const description = getCellValue(row, headers, 'description');
          const amountStr = getCellValue(row, headers, 'amount');
          const typeStr = getCellValue(row, headers, 'type');
          
          if (!date || !description || !amountStr) continue;

          // Processar valor
          let amount = parseAmount(amountStr);
          if (isNaN(amount) || amount === 0) continue;

          // Determinar tipo
          let type: 'income' | 'expense' = 'expense';
          if (typeStr) {
            const typeLower = typeStr.toLowerCase();
            if (typeLower.includes('receita') || typeLower.includes('income') || typeLower.includes('entrada') || amount > 0) {
              type = 'income';
            }
          } else {
            // Se não especificado, usar sinal do valor
            type = amount > 0 ? 'income' : 'expense';
          }

          // Garantir que amount seja positivo
          amount = Math.abs(amount);

          transactions.push({
            date: formatDate(date),
            description: description,
            amount: amount,
            type: type,
            category: getCellValue(row, headers, 'category'),
            tags: getCellValue(row, headers, 'tags') ? getCellValue(row, headers, 'tags').split(',').map(t => t.trim()) : [],
            reference: `XLSX-${i}`
          });
        } catch (error) {
          console.error(`Erro ao processar linha ${i}:`, error);
          continue;
        }
      }

      return transactions;
    } catch (error) {
      throw new Error('Erro ao processar arquivo XLSX');
    }
  };

  const getCellValue = (row: any[], headers: string[], fieldType: string): string => {
    const columnName = Object.keys(columnMapping).find(key => columnMapping[key] === fieldType);
    if (!columnName) return '';
    
    const columnIndex = headers.indexOf(columnName);
    return columnIndex >= 0 && columnIndex < row.length ? String(row[columnIndex] || '') : '';
  };

  const parseAmount = (amountStr: string): number => {
    // Remover símbolos de moeda e espaços
    let cleanAmount = amountStr.replace(/[R$\s]/g, '');
    
    // Tratar separador decimal (assumir ponto como padrão para XLSX)
    cleanAmount = cleanAmount.replace(',', '.');
    
    return parseFloat(cleanAmount);
  };

  const formatDate = (dateStr: string): string => {
    // Para XLSX, as datas geralmente já vêm em formato adequado
    if (typeof dateStr === 'string') {
      // Tentar diferentes formatos de data
      const dateFormats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
        /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
      ];

      for (const format of dateFormats) {
        if (format.test(dateStr)) {
          // Converter para formato padrão YYYY-MM-DD
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[0].length === 4) {
              // YYYY/MM/DD
              return dateStr.replace(/\//g, '-');
            } else {
              // DD/MM/YYYY
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          } else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 4) {
              // YYYY-MM-DD
              return dateStr;
            } else {
              // DD-MM-YYYY
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
        }
      }
    }
    
    // Se não conseguir formatar, retornar como está
    return String(dateStr);
  };

  const processXLSXAndShowTreatment = async () => {
    if (!file || !selectedAccountId) {
      toast({
        title: "Dados Incompletos",
        description: "Selecione um arquivo XLSX e uma conta de destino.",
        variant: "destructive",
      });
      return;
    }
    try {
      setImporting(true);
      setProgress(30);
      
      // Processar arquivo com novo sistema
      console.log('Processando arquivo XLSX:', file.name);
      const processedTemplate = await processor.processFile(file);
      setTemplate(processedTemplate);
      
      setProgress(60);
      
      // Validar dados
      const validation = processor.validateData(existingCategories || []);
      setValidationResult(validation);
      
      setProgress(80);
      
      // Gerar mapeamento de categorias
      const mappings = processor.generateCategoryMapping(existingCategories || []);
      setCategoryMappings(mappings);
      
      setProgress(100);
      
      if (processedTemplate.transactions.length === 0) {
        toast({
          title: "Nenhuma Transação Encontrada",
          description: "O arquivo XLSX não contém transações válidas ou todos os valores são inválidos.",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      // Converter para formato legado para compatibilidade
      const legacyTransactions = processedTemplate.transactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        tags: t.tags,
        reference: t.reference
      }));
      setImportedTransactions(legacyTransactions);

      // Mostrar modal de validação se houver avisos ou novas categorias
      if (validation.warnings.length > 0 || mappings.some(m => m.action === 'create')) {
        setShowValidationModal(true);
      } else {
        // Importação direta se tudo estiver válido
        await handleDirectImport(legacyTransactions);
      }

      toast({
        title: "Arquivo Processado",
        description: `${processedTemplate.transactions.length} transações encontradas.`
      });
    } catch (error) {
      console.error('Erro durante processamento:', error);
      toast({
        title: "Erro no Processamento",
        description: error instanceof Error ? error.message : "Erro desconhecido ao processar arquivo XLSX.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDirectImport = async (transactions: ImportedTransaction[]) => {
    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        setProgress((i / transactions.length) * 100);

        try {
          const transactionData = {
            user_id: user!.id,
            type: transaction.type,
            description: transaction.description,
            amount: transaction.amount,
            category_id: null, // Será mapeado automaticamente
            account_id: selectedAccountId,
            date: transaction.date,
            notes: `Importado de XLSX - Ref: ${transaction.reference || 'N/A'}`,
            tags: transaction.tags
          };

          const { error } = await insertTransaction(transactionData);
          
          if (error) {
            console.error('Erro ao inserir transação:', error);
            errorCount++;
          } else {
            await updateAccountBalance(selectedAccountId, transaction.amount, transaction.type);
            successCount++;
          }

        } catch (error) {
          console.error('Erro ao processar transação:', error);
          errorCount++;
        }
      }

      setProgress(100);
      setResults({ success: successCount, errors: errorCount, duplicates: 0 });

      if (successCount > 0) {
        toast({
          title: "Importação Concluída",
          description: `${successCount} transações importadas com sucesso!`,
        });
        window.dispatchEvent(new CustomEvent('transactionWithTagsAdded'));
      } else {
        toast({
          title: "Nenhuma Transação Importada",
          description: "Todas as transações falharam durante a importação.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Erro durante importação:', error);
      toast({
        title: "Erro na Importação",
        description: error instanceof Error ? error.message : "Erro desconhecido ao importar transações.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleValidationProceed = (mappings: CategoryMapping[], autoCreate: boolean) => {
    setShowValidationModal(false);
    setShowDataTreatment(true);
  };

  const handleValidationSkip = () => {
    setShowValidationModal(false);
    if (template) {
      const legacyTransactions = template.transactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        tags: t.tags,
        reference: t.reference
      }));
      handleDirectImport(legacyTransactions);
    }
  };

  const handleSaveTreatedTransactions = async (treatedTransactions: TreatedTransaction[]) => {
    try {
      setImporting(true);
      setProgress(0);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < treatedTransactions.length; i++) {
        const transaction = treatedTransactions[i];
        setProgress((i / treatedTransactions.length) * 100);

        try {
          const transactionData = {
            user_id: user!.id,
            type: transaction.type,
            description: transaction.description,
            amount: transaction.amount,
            category_id: transaction.category_id,
            account_id: selectedAccountId,
            date: transaction.date,
            notes: `Importado de XLSX - Ref: ${transaction.reference || 'N/A'}`,
            tags: transaction.tags
          };

          console.log('Inserindo transação:', transactionData);

          const { error } = await insertTransaction(transactionData);
          
          if (error) {
            console.error('Erro ao inserir transação:', error);
            errorCount++;
          } else {
            await updateAccountBalance(selectedAccountId, transaction.amount, transaction.type);
            successCount++;
          }

        } catch (error) {
          console.error('Erro ao processar transação:', error);
          errorCount++;
        }
      }

      setProgress(100);
      setResults({ success: successCount, errors: errorCount, duplicates: 0 });
      setShowDataTreatment(false);

      if (successCount > 0) {
        toast({
          title: "Importação Concluída",
          description: `${successCount} transações importadas com sucesso!`,
        });

        window.dispatchEvent(new CustomEvent('transactionWithTagsAdded'));
      } else {
        toast({
          title: "Nenhuma Transação Importada",
          description: "Todas as transações falharam durante a importação.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Erro durante importação:', error);
      toast({
        title: "Erro na Importação",
        description: error instanceof Error ? error.message : "Erro desconhecido ao importar transações.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImporter = () => {
    setFile(null);
    setImportedTransactions([]);
    setResults(null);
    setProgress(0);
    setSelectedAccountId("");
    setShowDataTreatment(false);
    setPreviewData([]);
    setAvailableColumns([]);
    setColumnMapping({});
  };

  const downloadTemplate = () => {
    // Usar o novo sistema de template avançado
    const workbook = XLSXProcessor.createAdvancedTemplate();
    
    // Gerar e baixar arquivo
    XLSX.writeFile(workbook, 'template_avancado_transacoes.xlsx');

    toast({
      title: "Template Avançado Baixado",
      description: "Template com abas de transações e categorias baixado com sucesso!",
    });
  };

  // Se estiver na tela de tratamento de dados
  if (showDataTreatment) {
    return (
      <XLSXDataTreatment
        transactions={importedTransactions}
        accountId={selectedAccountId}
        onSave={handleSaveTreatedTransactions}
        onCancel={() => setShowDataTreatment(false)}
      />
    );
  }

  // Modal de validação
  if (showValidationModal && validationResult && template) {
    return (
      <XLSXValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        validationResult={validationResult}
        categoryMappings={categoryMappings}
        transactions={template.transactions}
        categories={template.categories}
        onProceed={handleValidationProceed}
        onSkipTreatment={handleValidationSkip}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Importações Realizadas</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total de Contas</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{accounts?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card principal de importação */}
      <Card className="w-full border-2 border-dashed border-border hover:border-green-500/50 transition-colors duration-300 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            Importar Transações (XLSX)
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Arraste e solte seu arquivo XLSX ou clique para selecionar
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!results && (
            <>
              {/* Área de upload com drag & drop */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragOver 
                    ? 'border-green-500 bg-green-500/5 dark:bg-green-500/10' 
                    : 'border-border hover:border-green-500/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('xlsx-file-input')?.click()}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="xlsx-file-input"
                />
                
                {file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="h-12 w-12 text-green-500" />
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
                          ? 'bg-green-500/10 dark:bg-green-500/20' 
                          : 'bg-muted/50 dark:bg-muted'
                      }`}>
                        <FileSpreadsheet className={`h-12 w-12 transition-colors duration-300 ${
                          isDragOver ? 'text-green-600' : 'text-muted-foreground'
                        }`} />
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                        isDragOver ? 'text-green-600' : 'text-foreground'
                      }`}>
                        {isDragOver ? 'Solte o arquivo aqui' : 'Selecione um arquivo XLSX'}
                      </h3>
                      <p className={`text-sm mt-2 transition-colors duration-300 ${
                        isDragOver ? 'text-green-600/80' : 'text-muted-foreground'
                      }`}>
                        {isDragOver ? 'Arquivo será importado automaticamente' : 'ou arraste e solte aqui'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Configurações XLSX */}
              {file && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Configurações do Arquivo</h3>
                  
                  <Alert className="bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-foreground">
                      <strong>Formato XLSX:</strong> O arquivo será processado automaticamente. 
                      Certifique-se de que a primeira linha contém os cabeçalhos das colunas.
                    </AlertDescription>
                  </Alert>

                  {/* Preview dos dados */}
                  {previewData.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-foreground">Preview dos Dados</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              {availableColumns.map((col, index) => (
                                <th key={index} className="px-3 py-2 text-left font-medium text-foreground">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.slice(1, 4).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-t">
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-3 py-2 text-muted-foreground">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Mapeamento de colunas */}
                  {availableColumns.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-foreground">Mapeamento de Colunas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableColumns.map((column) => (
                          <div key={column} className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{column}</label>
                            <select
                              value={columnMapping[column] || 'ignore'}
                              onChange={(e) => setColumnMapping(prev => ({ ...prev, [column]: e.target.value }))}
                              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                            >
                              <option value="ignore">Ignorar</option>
                              <option value="date">Data</option>
                              <option value="description">Descrição</option>
                              <option value="amount">Valor</option>
                              <option value="type">Tipo</option>
                              <option value="category">Categoria</option>
                              <option value="tags">Tags</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-background text-foreground"
                >
                  <option value="">Selecione uma conta para importar as transações</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.bank || 'Conta'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Informações sobre o formato XLSX */}
              <Alert className="bg-green-500/5 dark:bg-green-500/10 border-green-500/20">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-foreground">
                  <strong>Template Avançado:</strong> Nosso template inclui abas separadas para transações e categorias, 
                  permitindo melhor organização e mapeamento automático. Suporta múltiplas abas e normalização inteligente.
                </AlertDescription>
              </Alert>

              {/* Botão para download do template */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Template Avançado
                </Button>
              </div>

              {/* Progresso do processamento */}
              {importing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando arquivo...
                    </span>
                    <span className="font-medium text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full h-2" />
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={processXLSXAndShowTreatment}
                  disabled={!file || !selectedAccountId || importing || availableColumns.length === 0}
                  className="flex items-center gap-2 px-8 py-3 text-lg font-medium"
                  size="lg"
                >
                  {importing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  {importing ? 'Processando...' : 'Processar Arquivo'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={resetImporter} 
                  disabled={importing}
                  size="lg"
                  className="px-8 py-3"
                >
                  <X className="h-5 w-5 mr-2" />
                  Limpar
                </Button>
              </div>
            </>
          )}

          {/* Resultados da importação */}
          {results && (
            <div className="space-y-6">
              <Alert className="bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-300 font-medium">
                  Importação concluída com sucesso!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 bg-green-50 dark:bg-green-950/50 rounded-xl text-center border border-green-200 dark:border-green-800">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{results.success}</div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-medium">Importadas</div>
                </div>
                <div className="p-6 bg-red-50 dark:bg-red-950/50 rounded-xl text-center border border-red-200 dark:border-red-800">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{results.errors}</div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-medium">Erros</div>
                </div>
                <div className="p-6 bg-yellow-50 dark:bg-yellow-950/50 rounded-xl text-center border border-yellow-200 dark:border-yellow-800">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{results.duplicates}</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Duplicatas</div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={resetImporter} 
                  className="flex items-center gap-2 px-8 py-3 text-lg font-medium"
                  size="lg"
                >
                  <Download className="h-5 w-5" />
                  Importar Outro Arquivo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default XLSXImporter;
