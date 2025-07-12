import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
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
  const [results, setResults] = useState<{
    success: number;
    errors: number;
    duplicates: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.ofx')) {
      setFile(selectedFile);
      setResults(null);
      setImportedTransactions([]);
      setShowDataTreatment(false);
    } else {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione um arquivo OFX válido.",
        variant: "destructive",
      });
    }
  };

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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Importar Extrato Bancário (OFX)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results && (
          <>
            {/* Upload de arquivo */}
            <div className="space-y-2">
              <label htmlFor="ofx-file" className="text-sm font-medium">
                Selecionar arquivo OFX
              </label>
              <Input
                id="ofx-file"
                type="file"
                accept=".ofx"
                onChange={handleFileChange}
                disabled={importing}
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {file.name} selecionado
                </div>
              )}
            </div>

            {/* Seleção de conta */}
            <div className="space-y-2">
              <label htmlFor="account-select" className="text-sm font-medium">
                Conta de destino
              </label>
              <select
                id="account-select"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={importing}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione uma conta</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.bank || 'Conta'}
                  </option>
                ))}
              </select>
            </div>

            {/* Progresso do processamento */}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processando arquivo...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                onClick={processOFXAndShowTreatment}
                disabled={!file || !selectedAccountId || importing}
                className="flex items-center gap-2"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {importing ? 'Processando...' : 'Processar Arquivo'}
              </Button>
              
              <Button variant="outline" onClick={resetImporter} disabled={importing}>
                Limpar
              </Button>
            </div>
          </>
        )}

        {/* Resultados da importação */}
        {results && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Importação concluída!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.success}</div>
                <div className="text-sm text-green-700">Importadas</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{results.errors}</div>
                <div className="text-sm text-red-700">Erros</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{results.duplicates}</div>
                <div className="text-sm text-yellow-700">Duplicatas</div>
              </div>
            </div>

            <Button onClick={resetImporter} className="w-full">
              Importar Outro Arquivo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OFXImporter;
