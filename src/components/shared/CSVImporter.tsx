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
import CSVDataTreatment from "./CSVDataTreatment";

interface CSVColumn {
  name: string;
  type: 'date' | 'description' | 'amount' | 'type' | 'category' | 'tags' | 'ignore';
  required: boolean;
  sample?: string;
}

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

interface CSVConfig {
  delimiter: string;
  hasHeader: boolean;
  encoding: string;
  decimalSeparator: string;
}

const CSVImporter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: accounts } = useSupabaseData('accounts', user?.id);
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

  // Configurações CSV
  const [csvConfig, setCsvConfig] = useState<CSVConfig>({
    delimiter: ',',
    hasHeader: true,
    encoding: 'UTF-8',
    decimalSeparator: '.'
  });

  // Mapeamento de colunas
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelection(selectedFile);
  };

  const handleFileSelection = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(selectedFile);
      setResults(null);
      setImportedTransactions([]);
      setShowDataTreatment(false);
      setPreviewData([]);
      setAvailableColumns([]);
      setColumnMapping({});
      
      // Processar preview do arquivo
      processCSVPreview(selectedFile, csvConfig);
      
      toast({
        title: "Arquivo Selecionado",
        description: `${selectedFile.name} foi carregado com sucesso.`,
      });
    } else if (selectedFile) {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
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

  const processCSVPreview = async (file: File, config?: CSVConfig) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const previewLines = lines.slice(0, 5); // Primeiras 5 linhas para preview
      
      const currentConfig = config || csvConfig;
      const parsedData = previewLines.map(line => 
        line.split(currentConfig.delimiter).map(cell => cell.trim().replace(/"/g, ''))
      );
      
      setPreviewData(parsedData);
      
      if (currentConfig.hasHeader && parsedData.length > 0) {
        setAvailableColumns(parsedData[0]);
        // Mapeamento automático baseado em nomes de colunas
        const autoMapping: { [key: string]: string } = {};
        parsedData[0].forEach((col, index) => {
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
      console.error('Erro ao processar preview:', error);
      toast({
        title: "Erro no Preview",
        description: "Não foi possível processar o preview do arquivo CSV.",
        variant: "destructive",
      });
    }
  };

  const processCSVFile = async (file: File): Promise<ImportedTransaction[]> => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      let startIndex = csvConfig.hasHeader ? 1 : 0;
      const transactions: ImportedTransaction[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const cells = line.split(csvConfig.delimiter).map(cell => cell.trim().replace(/"/g, ''));
        
        if (cells.length < 3) continue; // Linha muito curta, ignorar

        try {
          // Extrair dados baseado no mapeamento
          const date = getCellValue(cells, 'date');
          const description = getCellValue(cells, 'description');
          const amountStr = getCellValue(cells, 'amount');
          const typeStr = getCellValue(cells, 'type');
          
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
            category: getCellValue(cells, 'category'),
            tags: getCellValue(cells, 'tags') ? getCellValue(cells, 'tags').split(',').map(t => t.trim()) : [],
            reference: `CSV-${i}`
          });
        } catch (error) {
          console.error(`Erro ao processar linha ${i}:`, error);
          continue;
        }
      }

      return transactions;
    } catch (error) {
      throw new Error('Erro ao processar arquivo CSV');
    }
  };

  const getCellValue = (cells: string[], fieldType: string): string => {
    const columnName = Object.keys(columnMapping).find(key => columnMapping[key] === fieldType);
    if (!columnName) return '';
    
    const columnIndex = availableColumns.indexOf(columnName);
    return columnIndex >= 0 && columnIndex < cells.length ? cells[columnIndex] : '';
  };

  const parseAmount = (amountStr: string): number => {
    // Remover símbolos de moeda e espaços
    let cleanAmount = amountStr.replace(/[R$\s]/g, '');
    
    // Tratar separador decimal
    if (csvConfig.decimalSeparator === ',') {
      cleanAmount = cleanAmount.replace('.', '').replace(',', '.');
    }
    
    return parseFloat(cleanAmount);
  };

  const formatDate = (dateStr: string): string => {
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

    // Se não conseguir formatar, retornar data atual
    return new Date().toISOString().split('T')[0];
  };

  const processCSVAndShowTreatment = async () => {
    if (!file || !selectedAccountId) {
      toast({
        title: "Dados Incompletos",
        description: "Selecione um arquivo CSV e uma conta de destino.",
        variant: "destructive",
      });
      return;
    }

    // Validar mapeamento obrigatório
    const requiredFields = ['date', 'description', 'amount'];
    const missingFields = requiredFields.filter(field => 
      !Object.values(columnMapping).includes(field)
    );

    if (missingFields.length > 0) {
      toast({
        title: "Mapeamento Incompleto",
        description: `Mapeie as colunas obrigatórias: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      setProgress(50);

      console.log('Processando arquivo CSV:', file.name);
      const transactions = await processCSVFile(file);
      console.log('Transações processadas:', transactions);
      
      setImportedTransactions(transactions);
      setProgress(100);

      if (transactions.length === 0) {
        toast({
          title: "Nenhuma Transação Encontrada",
          description: "O arquivo CSV não contém transações válidas ou todos os valores são inválidos.",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      // Mostrar tela de tratamento de dados
      setShowDataTreatment(true);
      toast({
        title: "Arquivo Processado",
        description: `${transactions.length} transações encontradas. Trate os dados antes de importar.`,
      });

    } catch (error) {
      console.error('Erro durante processamento:', error);
      toast({
        title: "Erro no Processamento",
        description: error instanceof Error ? error.message : "Erro desconhecido ao processar arquivo CSV.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
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
            notes: `Importado de CSV - Ref: ${transaction.reference || 'N/A'}`,
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
    const template = `Data,Descrição,Valor,Tipo,Categoria,Tags
2024-01-15,Compra no supermercado,-150.50,Despesa,Alimentação,compras
2024-01-16,Salário,+3000.00,Receita,Salário,trabalho
2024-01-17,Uber,-25.00,Despesa,Transporte,transporte`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_transacoes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Se estiver na tela de tratamento de dados
  if (showDataTreatment) {
    return (
      <CSVDataTreatment
        transactions={importedTransactions}
        accountId={selectedAccountId}
        onSave={handleSaveTreatedTransactions}
        onCancel={() => setShowDataTreatment(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Importações CSV</p>
                <p className="text-2xl font-bold text-green-700">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total de Contas</p>
                <p className="text-2xl font-bold text-blue-700">{accounts?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Usuário Ativo</p>
                <p className="text-2xl font-bold text-purple-700">{user?.email?.split('@')[0] || 'Usuário'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card principal de importação */}
      <Card className="w-full border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors duration-300">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            Importar Transações (CSV)
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Arraste e solte seu arquivo CSV ou clique para selecionar
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!results && (
            <>
              {/* Área de upload com drag & drop */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragOver 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500">
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
                    <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Arraste seu arquivo CSV aqui
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ou clique para selecionar
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-file-input"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('csv-file-input')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Selecionar Arquivo
                    </Button>
                  </div>
                )}
              </div>

              {/* Configurações CSV */}
              {file && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Configurações do CSV</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Delimitador</label>
                      <select
                        value={csvConfig.delimiter}
                                                 onChange={(e) => {
                           const newConfig = { ...csvConfig, delimiter: e.target.value };
                           setCsvConfig(newConfig);
                           if (file) processCSVPreview(file, newConfig);
                         }}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value=",">Vírgula (,)</option>
                        <option value=";">Ponto e vírgula (;)</option>
                        <option value="\t">Tabulação</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Separador Decimal</label>
                      <select
                        value={csvConfig.decimalSeparator}
                        onChange={(e) => setCsvConfig(prev => ({ ...prev, decimalSeparator: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value=".">Ponto (.)</option>
                        <option value=",">Vírgula (,)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Cabeçalho</label>
                      <select
                        value={csvConfig.hasHeader ? 'true' : 'false'}
                                                 onChange={(e) => {
                           const newConfig = { ...csvConfig, hasHeader: e.target.value === 'true' };
                           setCsvConfig(newConfig);
                           if (file) processCSVPreview(file, newConfig);
                         }}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="true">Com cabeçalho</option>
                        <option value="false">Sem cabeçalho</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Encoding</label>
                      <select
                        value={csvConfig.encoding}
                        onChange={(e) => setCsvConfig(prev => ({ ...prev, encoding: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="UTF-8">UTF-8</option>
                        <option value="ISO-8859-1">ISO-8859-1</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview dos dados */}
                  {previewData.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-gray-800">Preview dos Dados</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {availableColumns.map((col, index) => (
                                <th key={index} className="px-3 py-2 text-left font-medium text-gray-700">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.slice(csvConfig.hasHeader ? 1 : 0, 4).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-t">
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-3 py-2 text-gray-600">
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
                      <h4 className="text-md font-medium text-gray-800">Mapeamento de Colunas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableColumns.map((column) => (
                          <div key={column} className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{column}</label>
                            <select
                              value={columnMapping[column] || 'ignore'}
                              onChange={(e) => setColumnMapping(prev => ({ ...prev, [column]: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md"
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
                <label htmlFor="account-select" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Conta de Destino
                </label>
                <select
                  id="account-select"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  disabled={importing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                >
                  <option value="">Selecione uma conta para importar as transações</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.bank || 'Conta'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Informações sobre o formato CSV */}
              <Alert className="bg-green-50 border-green-200">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  <strong>Formato CSV:</strong> Arquivos CSV são compatíveis com planilhas Excel, Google Sheets e outros sistemas. 
                  Baixe nosso template para ver o formato correto.
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
                  Baixar Template CSV
                </Button>
              </div>

              {/* Progresso do processamento */}
              {importing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando arquivo...
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full h-2" />
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={processCSVAndShowTreatment}
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
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-700 font-medium">
                  Importação concluída com sucesso!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 bg-green-50 rounded-xl text-center border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">{results.success}</div>
                  <div className="text-sm text-green-700 font-medium">Importadas</div>
                </div>
                <div className="p-6 bg-red-50 rounded-xl text-center border border-red-200">
                  <div className="text-3xl font-bold text-red-600 mb-1">{results.errors}</div>
                  <div className="text-sm text-red-700 font-medium">Erros</div>
                </div>
                <div className="p-6 bg-yellow-50 rounded-xl text-center border border-yellow-200">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">{results.duplicates}</div>
                  <div className="text-sm text-yellow-700 font-medium">Duplicatas</div>
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

export default CSVImporter;
