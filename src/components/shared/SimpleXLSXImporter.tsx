import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, X, Database, FileSpreadsheet, Eye, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { convertToLocalDateString } from '@/utils/dateValidation';
import { useBalanceUpdates } from '@/hooks/useBalanceUpdates';
import { useCategoryTagValidation } from '@/hooks/useCategoryTagValidation';
import { XLSXTemplateGenerator } from '@/utils/xlsxTemplateGenerator';
import { testTransactionInsert } from '@/utils/testTransactionInsert';
import CategoryTagValidationModal from './CategoryTagValidationModal';
import { AccountSelector } from './AccountSelector';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
interface XLSXRow {
  data: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string;
  categoria_id?: string;
  tags: string;
}
interface ImportResult {
  success: number;
  errors: number;
  total: number;
}
interface ValidationItem {
  name: string;
  type: 'category' | 'tag';
  count: number;
  action: 'create' | 'ignore';
}
const SimpleXLSXImporter: React.FC = () => {
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
    insert: insertTransaction,
    refetch: refetchTransactions
  } = useSupabaseData('transactions', user?.id);
  const {
    data: categories,
    refetch: refetchCategories
  } = useSupabaseData('categories', user?.id);
  const {
    data: tags,
    refetch: refetchTags
  } = useSupabaseData('tags', user?.id);
  const {
    updateAccountBalance
  } = useBalanceUpdates();
  const {
    detectUnmappedItems,
    createItems,
    applyValidationChoices,
    findCategoryByName,
    findTagByName
  } = useCategoryTagValidation();
  const [file, setFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [previewData, setPreviewData] = useState<XLSXRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Estados para validação de categorias/tags
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationCategories, setValidationCategories] = useState<ValidationItem[]>([]);
  const [validationTags, setValidationTags] = useState<ValidationItem[]>([]);
  const [pendingImportData, setPendingImportData] = useState<XLSXRow[]>([]);

  // Validação das colunas obrigatórias
  const validateColumns = (headers: string[]): {
    isValid: boolean;
    missingColumns: string[];
  } => {
    const requiredColumns = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Tags'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    return {
      isValid: missingColumns.length === 0,
      missingColumns
    };
  };

  // Processar arquivo XLSX
  const processFile = useCallback(async (selectedFile: File) => {
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array'
      });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1
      });
      if (jsonData.length < 2) {
        throw new Error('Arquivo deve ter pelo menos cabeçalho e uma linha de dados');
      }
      const headers = jsonData[0] as string[];
      const validation = validateColumns(headers);
      if (!validation.isValid) {
        throw new Error(`Colunas obrigatórias ausentes: ${validation.missingColumns.join(', ')}`);
      }
      const dataRows = jsonData.slice(1);
      const processedData: XLSXRow[] = [];
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        if (!row || row.length === 0) continue;
        try {
          const data = String(row[0] || '').trim();
          const descricao = String(row[1] || '').trim();
          const valorStr = String(row[2] || '').trim();
          const tipo = String(row[3] || '').trim().toLowerCase();
          const categoria = String(row[4] || '').trim();
          const tags = String(row[5] || '').trim();

          // Validar campos obrigatórios
          if (!data || !descricao || !valorStr || !tipo) {
            continue;
          }

          // Processar valor
          const valor = parseFloat(valorStr.replace(/[R$\s]/g, '').replace(',', '.'));
          if (isNaN(valor)) {
            continue;
          }

          // Validar tipo
          if (tipo !== 'receita' && tipo !== 'despesa') {
            continue;
          }

          // Processar data
          let formattedDate = data;

          // Se a data é um número (serial do Excel)
          if (!isNaN(Number(data)) && Number(data) > 25569) {
            // 25569 é aproximadamente 1970-01-01 em Excel
            try {
              // Converter número serial do Excel para data
              const excelEpoch = new Date(1900, 0, 1);
              const days = Number(data) - 2; // -2 porque Excel trata 1900 incorretamente como ano bissexto
              const resultDate = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
              formattedDate = resultDate.toISOString().split('T')[0]; // YYYY-MM-DD
              console.log(`Convertendo data serial do Excel: ${data} -> ${formattedDate}`);
            } catch (error) {
              console.error('Erro ao converter data serial do Excel:', error);
              formattedDate = data; // Manter original se falhar
            }
          } else if (data.includes('/')) {
            // Processar datas no formato DD/MM/YYYY ou YYYY/MM/DD
            const parts = data.split('/');
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                // YYYY/MM/DD - usar função genérica para evitar problemas de timezone
                formattedDate = convertToLocalDateString(parts[0], parts[1], parts[2]);
              } else {
                // DD/MM/YYYY - usar função genérica para evitar problemas de timezone
                formattedDate = convertToLocalDateString(parts[2], parts[1], parts[0]);
              }
            }
          } else if (data.includes('-')) {
            // Já está no formato YYYY-MM-DD ou DD-MM-YYYY
            const parts = data.split('-');
            if (parts.length === 3 && parts[0].length === 2) {
              // DD-MM-YYYY -> usar função genérica para evitar problemas de timezone
              formattedDate = convertToLocalDateString(parts[2], parts[1], parts[0]);
            } else if (parts.length === 3 && parts[0].length === 4) {
              // YYYY-MM-DD - usar função genérica para evitar problemas de timezone
              formattedDate = convertToLocalDateString(parts[0], parts[1], parts[2]);
            }
          }
          processedData.push({
            data: formattedDate,
            descricao,
            valor,
            tipo: tipo as 'receita' | 'despesa',
            categoria,
            tags
          });
        } catch (error) {
          console.warn(`Erro ao processar linha ${i + 2}:`, error);
          continue;
        }
      }
      setPreviewData(processedData);
      setShowPreview(true);
      toast({
        title: "Arquivo processado",
        description: `${processedData.length} linhas válidas encontradas`
      });
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  }, [toast]);

  // Upload de arquivo
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo XLSX válido.",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      processFile(selectedFile);
    }
  }, [processFile, toast]);

  // Drag and drop
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
    if (droppedFile) {
      const fileName = droppedFile.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo XLSX válido.",
          variant: "destructive"
        });
        return;
      }
      setFile(droppedFile);
      processFile(droppedFile);
    }
  }, [processFile, toast]);

  // Verificar categorias e tags antes da importação
  const handleImport = useCallback(async () => {
    if (!selectedAccountId || previewData.length === 0) return;
    try {
      // Detectar categorias e tags não mapeadas
      const validationResult = detectUnmappedItems(previewData);
      if (validationResult.hasUnmappedItems) {
        // Mostrar modal de validação
        setValidationCategories(validationResult.categories);
        setValidationTags(validationResult.tags);
        setPendingImportData(previewData);
        setShowValidationModal(true);
        return;
      }

      // Se não há itens para validar, prosseguir diretamente
      await proceedWithImport(previewData);
    } catch (error) {
      toast({
        title: "Erro na validação",
        description: "Ocorreu um erro ao validar categorias e tags.",
        variant: "destructive"
      });
    }
  }, [selectedAccountId, previewData, detectUnmappedItems, toast]);

  // Processar importação após validação (gravação transacional)
  const proceedWithImport = useCallback(async (dataToImport: XLSXRow[]) => {
    setIsProcessing(true);
    let success = 0;
    let errors = 0;
    const insertedTransactions: any[] = [];
    try {
      // Preparar todas as transações para inserção
      const transactionsToInsert = dataToImport.map(row => {
        const isIncome = row.tipo === 'receita' || row.valor > 0;
        const amount = Math.abs(row.valor);
        const type = isIncome ? 'income' : 'expense';

        // Processar categoria - usar categoria_id se disponível, senão buscar por nome
        let category_id = null;
        if (row.categoria_id) {
          category_id = row.categoria_id;
        } else if (row.categoria && row.categoria.trim()) {
          const category = findCategoryByName(row.categoria.trim());
          if (category) {
            category_id = category.id;
          }
        }

        // Processar tags - usar array de objetos se disponível, senão processar string
        let tags = [];
        if (Array.isArray(row.tags)) {
          tags = row.tags;
        } else if (row.tags && typeof row.tags === 'string') {
          const tagNames = row.tags.split(',').map(t => t.trim()).filter(t => t);
          tags = tagNames.map(tagName => {
            const tag = findTagByName(tagName);
            return tag ? {
              id: tag.id,
              name: tag.name,
              color: tag.color
            } : null;
          }).filter(tag => tag !== null);
        }
        const transactionData = {
          account_id: selectedAccountId,
          date: row.data,
          description: row.descricao,
          amount: amount,
          type: type,
          category_id: category_id,
          tags: tags.length > 0 ? tags : [],
          // Garantir que tags seja sempre um array
          user_id: user?.id
        };

        // Remover campos undefined/null desnecessários
        if (!transactionData.category_id) {
          delete transactionData.category_id;
        }
        return transactionData;
      });

      // Inserir todas as transações em lote
      for (const transaction of transactionsToInsert) {
        try {
          console.log('=== INSERINDO TRANSAÇÃO ===');
          console.log('Dados da transação:', JSON.stringify(transaction, null, 2));
          console.log('Tipo de account_id:', typeof transaction.account_id);
          console.log('Tipo de amount:', typeof transaction.amount);
          console.log('Tipo de tags:', typeof transaction.tags, Array.isArray(transaction.tags));
          console.log('Tags:', transaction.tags);
          const result = await insertTransaction(transaction);
          console.log('Resultado da inserção:', result);
          if (result.error) {
            console.error('Erro retornado pela função insert:', result.error);
            throw new Error(result.error);
          }
          if (result.data && result.data[0]) {
            insertedTransactions.push(result.data[0]);
            success++;
            console.log('✅ Transação inserida com sucesso:', result.data[0]);
          } else {
            console.error('❌ Nenhum dado retornado na inserção');
            console.error('Result.data:', result.data);
            throw new Error('Nenhum dado retornado na inserção');
          }
        } catch (error) {
          console.error('❌ ERRO ao inserir transação:', error);
          console.error('Dados da transação que falhou:', JSON.stringify(transaction, null, 2));
          errors++;

          // Se há muitos erros, interromper o processo
          if (errors > dataToImport.length * 0.1) {
            // Mais de 10% de erro
            throw new Error('Muitos erros na importação. Processo interrompido.');
          }
        }
      }

      // Atualizar saldo da conta apenas se houve sucessos
      if (success > 0) {
        await updateAccountBalance(selectedAccountId);

        // Refresh das transações para que apareçam imediatamente
        await refetchTransactions();
      }
      setResult({
        success,
        errors,
        total: dataToImport.length
      });

      // Mensagem de sucesso diferenciada
      if (errors === 0) {
        toast({
          title: "Importação concluída com sucesso",
          description: `✅ ${success} lançamentos gravados na conta ${accounts?.find(a => a.id === selectedAccountId)?.name || 'selecionada'}`
        });
      } else {
        toast({
          title: "Importação concluída com avisos",
          description: `✅ ${success} lançamentos gravados, ${errors} falharam na conta ${accounts?.find(a => a.id === selectedAccountId)?.name || 'selecionada'}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      // Em caso de erro crítico, tentar reverter transações inseridas
      console.error('Erro crítico na importação:', error);

      // Nota: Em um sistema real, aqui seria implementado um rollback transacional
      // Por enquanto, apenas reportamos o erro

      toast({
        title: "Erro na importação",
        description: `Ocorreu um erro durante a importação. ${success} transações foram salvas antes do erro.`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAccountId, insertTransaction, updateAccountBalance, user?.id, accounts, toast, refetchTransactions]);

  // Processar escolhas do modal de validação
  const handleValidationConfirm = useCallback(async (validationItems: ValidationItem[]) => {
    try {
      setIsProcessing(true);

      // Criar categorias e tags selecionadas
      const createResult = await createItems(validationItems);
      if (createResult.errors > 0) {
        toast({
          title: "Aviso",
          description: `${createResult.success} itens criados, ${createResult.errors} falharam.`,
          variant: "destructive"
        });
      }

      // Refresh dos dados para incluir as categorias/tags recém-criadas
      if (createResult.success > 0) {
        await Promise.all([refetchCategories(), refetchTags()]);
      }

      // Aplicar escolhas aos dados com os itens criados
      const processedData = applyValidationChoices(pendingImportData, validationItems, createResult.createdItems);

      // Prosseguir com importação
      await proceedWithImport(processedData);
    } catch (error) {
      toast({
        title: "Erro na validação",
        description: "Ocorreu um erro ao processar as escolhas.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setShowValidationModal(false);
    }
  }, [createItems, applyValidationChoices, pendingImportData, proceedWithImport, toast, refetchCategories, refetchTags]);

  // Teste de inserção
  const handleTestInsert = useCallback(async () => {
    if (!user?.id || !selectedAccountId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta primeiro",
        variant: "destructive"
      });
      return;
    }
    try {
      const result = await testTransactionInsert(supabase, user.id, selectedAccountId);
      if (result.success) {
        toast({
          title: "Teste bem-sucedido",
          description: "Transação de teste inserida com sucesso!"
        });
      } else {
        toast({
          title: "Teste falhou",
          description: `Erro: ${result.error?.message || 'Erro desconhecido'}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Erro ao executar teste de inserção",
        variant: "destructive"
      });
    }
  }, [user?.id, selectedAccountId, toast]);

  // Download template
  const handleDownloadTemplate = useCallback(() => {
    try {
      XLSXTemplateGenerator.downloadTemplate();
      toast({
        title: "Template baixado",
        description: "Template XLSX baixado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro ao baixar template",
        description: "Não foi possível baixar o template.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Reset
  const handleReset = useCallback(() => {
    setFile(null);
    setSelectedAccountId('');
    setPreviewData([]);
    setShowPreview(false);
    setResult(null);
  }, []);

  // Se há resultado, mostrar tela de sucesso
  if (result) {
    return <Card className="w-full max-w-4xl mx-auto">
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
              ✅ Importação concluída: {result.success} lançamentos gravados na conta {accounts?.find(a => a.id === selectedAccountId)?.name || 'selecionada'}.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-6 bg-green-50 dark:bg-green-950/50 rounded-xl text-center border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{result.success}</div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">Importados</div>
            </div>
            <div className="p-6 bg-red-50 dark:bg-red-950/50 rounded-xl text-center border border-red-200 dark:border-red-800">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{result.errors}</div>
              <div className="text-sm text-red-700 dark:text-red-300 font-medium">Erros</div>
            </div>
            <div className="p-6 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-center border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{result.total}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total</div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleReset} className="flex items-center gap-2 px-8 py-3 text-lg font-medium" size="lg">
              <Upload className="h-5 w-5" />
              Importar Outro Arquivo
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Importar Transações XLSX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload do arquivo */}
        <div className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${isDragOver ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' : 'border-border hover:border-blue-500/50'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => document.getElementById('file-input')?.click()}>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-input" />
          
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
              <Button variant="outline" onClick={() => setFile(null)} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Remover Arquivo
              </Button>
            </div> : <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`p-4 rounded-full transition-colors duration-300 ${isDragOver ? 'bg-blue-500/10 dark:bg-blue-500/20' : 'bg-muted/50 dark:bg-muted'}`}>
                  <FileSpreadsheet className={`h-12 w-12 transition-colors duration-300 ${isDragOver ? 'text-blue-600' : 'text-muted-foreground'}`} />
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${isDragOver ? 'text-blue-600' : 'text-foreground'}`}>
                  {isDragOver ? 'Solte o arquivo aqui' : 'Selecione um arquivo XLSX'}
                </h3>
                <p className={`text-sm mt-2 transition-colors duration-300 ${isDragOver ? 'text-blue-600/80' : 'text-muted-foreground'}`}>
                  {isDragOver ? 'Arquivo será processado automaticamente' : 'ou arraste e solte aqui'}
                </p>
              </div>
            </div>}
        </div>

        {/* Seleção da conta */}
        {file && <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelect={setSelectedAccountId}
          disabled={isProcessing}
          colorScheme="blue"
        />}

        {/* Pré-visualização */}
        {showPreview && previewData.length > 0 && <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pré-visualização dos Dados ({previewData.length} linhas)
              </h4>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                <X className="h-4 w-4 mr-2" />
                Ocultar
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Data</th>
                    <th className="px-3 py-2 text-left font-medium">Descrição</th>
                    <th className="px-3 py-2 text-left font-medium">Valor</th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium">Categoria</th>
                    <th className="px-3 py-2 text-left font-medium">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 20).map((row, index) => <tr key={index} className="border-t">
                      <td className="px-3 py-2">{row.data}</td>
                      <td className="px-3 py-2">{row.descricao}</td>
                      <td className="px-3 py-2">
                        <span className={row.tipo === 'despesa' ? 'text-red-600' : 'text-green-600'}>
                          R$ {row.valor.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={row.tipo === 'despesa' ? 'destructive' : 'default'}>
                          {row.tipo === 'despesa' ? 'Despesa' : 'Receita'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{row.categoria || '-'}</td>
                      <td className="px-3 py-2">{row.tags || '-'}</td>
                    </tr>)}
                </tbody>
              </table>
              {previewData.length > 20 && <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                  Mostrando 20 de {previewData.length} linhas
                </div>}
            </div>
          </div>}

        {/* Informações sobre formato */}
        

        {/* Botões de utilitários */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Baixar Template XLSX
          </Button>
          
          <Button variant="outline" onClick={handleTestInsert} disabled={!selectedAccountId} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Testar Inserção
          </Button>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 justify-center">
          <Button onClick={handleImport} disabled={!file || !selectedAccountId || previewData.length === 0 || isProcessing} className="flex items-center gap-2 px-8 py-3 text-lg font-medium" size="lg">
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            {isProcessing ? 'Importando...' : 'Confirmar Importação'}
          </Button>
          
          <Button variant="outline" onClick={handleReset} disabled={isProcessing} size="lg" className="px-8 py-3">
            <X className="h-5 w-5 mr-2" />
            Limpar
          </Button>
        </div>

        {/* Modal de validação de categorias e tags */}
        <CategoryTagValidationModal isOpen={showValidationModal} onClose={() => setShowValidationModal(false)} onConfirm={handleValidationConfirm} categories={validationCategories} tags={validationTags} />
      </CardContent>
    </Card>;
};
export default SimpleXLSXImporter;