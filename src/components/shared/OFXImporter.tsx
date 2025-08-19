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
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import OFXDataTreatment from "./OFXDataTreatment";

interface ImportedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  reference?: string;
}

interface TreatedTransaction extends ImportedTransaction {
  id: string;
  category_id?: string;
  tags: string[];
  selected: boolean;
}

const OFXImporter = () => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelection(selectedFile);
  };

  const handleFileSelection = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.ofx')) {
      setFile(selectedFile);
      setResults(null);
      setImportedTransactions([]);
      setShowDataTreatment(false);
      toast({
        title: "Arquivo Selecionado",
        description: `${selectedFile.name} foi carregado com sucesso.`,
      });
    } else if (selectedFile) {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione um arquivo OFX válido.",
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

  const processOFXFile = async (file: File): Promise<ImportedTransaction[]> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://importar-transacoes-api.onrender.com/api/process-ofx', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('API Response:', result);
    
    if (result.success && result.data && result.data.transactions) {
      return result.data.transactions.map((transaction: any) => {
        const valor = transaction.valor;
        
        console.log('Processing transaction:', {
          original: transaction,
          valor: valor,
          isValidNumber: typeof valor === 'number' && !isNaN(valor) && valor !== 0
        });
        
        if (typeof valor !== 'number' || isNaN(valor) || valor === 0) {
          console.warn('Transação com valor inválido ignorada:', transaction);
          return null;
        }
        
        return {
          date: transaction.data || new Date().toISOString().split('T')[0],
          description: transaction.descricao || transaction.description || transaction.memo || 'Transação importada',
          amount: Math.abs(valor),
          type: valor >= 0 ? 'income' : 'expense',
          reference: transaction.fitid || transaction.checknum || transaction.id
        };
      }).filter((transaction: ImportedTransaction | null): transaction is ImportedTransaction => {
        return transaction !== null;
      });
    } else {
      throw new Error(result.error || 'Erro ao processar arquivo OFX ou arquivo sem transações válidas');
    }
  };

  const processOFXAndShowTreatment = async () => {
    if (!file || !selectedAccountId) {
      toast({
        title: "Dados Incompletos",
        description: "Selecione um arquivo OFX e uma conta de destino.",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      setProgress(50);

      console.log('Processando arquivo OFX:', file.name);
      const transactions = await processOFXFile(file);
      console.log('Transações processadas:', transactions);
      
      setImportedTransactions(transactions);
      setProgress(100);

      if (transactions.length === 0) {
        toast({
          title: "Nenhuma Transação Encontrada",
          description: "O arquivo OFX não contém transações válidas ou todos os valores são inválidos.",
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
        description: error instanceof Error ? error.message : "Erro desconhecido ao processar arquivo OFX.",
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
            notes: `Importado de OFX - Ref: ${transaction.reference || 'N/A'}`,
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
  };

  // Se estiver na tela de tratamento de dados
  if (showDataTreatment) {
    return (
      <OFXDataTreatment
        transactions={importedTransactions}
        accountId={selectedAccountId}
        onSave={handleSaveTreatedTransactions}
        onCancel={() => setShowDataTreatment(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Importações Realizadas</p>
                <p className="text-2xl font-bold text-green-700">0</p>
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
      <Card className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors duration-300">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
            <FileText className="h-8 w-8 text-blue-600" />
            Importar Extrato Bancário (OFX)
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Arraste e solte seu arquivo OFX ou clique para selecionar
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!results && (
            <>
              {/* Área de upload com drag & drop */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50' 
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
                        Arraste seu arquivo OFX aqui
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ou clique para selecionar
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".ofx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="ofx-file-input"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('ofx-file-input')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Selecionar Arquivo
                    </Button>
                  </div>
                )}
              </div>

              {/* Seleção de conta com design melhorado */}
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="">Selecione uma conta para importar as transações</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.bank || 'Conta'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Informações sobre o formato OFX */}
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  <strong>Formato OFX:</strong> O arquivo OFX (Open Financial Exchange) é um padrão 
                  para troca de dados financeiros. Suportamos arquivos OFX 1.x e 2.x de bancos brasileiros.
                </AlertDescription>
              </Alert>

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
                  onClick={processOFXAndShowTreatment}
                  disabled={!file || !selectedAccountId || importing}
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

export default OFXImporter;
