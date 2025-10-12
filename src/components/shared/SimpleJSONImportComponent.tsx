import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  FileJson,
  Eye,
  MessageSquare,
  Plus,
} from "lucide-react";
import { useJSONImport } from "@/hooks/useJSONImport";
import { ImportedTransaction } from "@/hooks/useImport";
import { AccountSelector } from "./AccountSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const SimpleJSONImportComponent: React.FC = () => {
  const { importing, progress, result, accounts, categories, importFile, reset, detectMissingCategories, processJSON } = useJSONImport();
  const { user } = useAuth();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedTransaction[]>([]);
  const [missingCategories, setMissingCategories] = useState<string[]>([]);
  const [selectedCategoriesToCreate, setSelectedCategoriesToCreate] = useState<Set<string>>(new Set());
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  // Função para processar preview do arquivo JSON
  const handleFilePreview = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      if (!data.transactions || !Array.isArray(data.transactions)) {
        alert('Formato JSON inválido. O arquivo deve conter um array "transactions".');
        return;
      }

      // Preview das primeiras 5 transações
      const transactions: ImportedTransaction[] = data.transactions
        .slice(0, 5)
        .filter((t: any) => t.date && t.description && t.amount !== undefined && t.type)
        .map((t: any) => ({
          date: t.date,
          description: t.description,
          amount: Math.abs(parseFloat(t.amount)),
          type: t.type,
          category: t.category,
          tags: t.tags || [],
        }));

      setPreviewData(transactions);
      setShowPreview(true);
    } catch (error) {
      console.error("Erro ao gerar preview JSON:", error);
      alert("Erro ao processar arquivo JSON. Verifique se o formato está correto.");
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        handleFilePreview(selectedFile);
      }
    },
    [handleFilePreview],
  );

  const handleFileSelection = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return;

      const fileName = selectedFile.name.toLowerCase();
      const isJSON = fileName.endsWith(".json");

      if (!isJSON) {
        alert("Por favor, selecione um arquivo JSON válido (.json).");
        return;
      }

      setFile(selectedFile);
      handleFilePreview(selectedFile);
    },
    [handleFilePreview],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    },
    [handleFileSelection],
  );

  const handleImport = useCallback(async () => {
    if (!file || !selectedAccountId || !user) return;

    try {
      // Processar arquivo e detectar categorias faltantes
      const transactions = await processJSON(file);
      const missing = detectMissingCategories(transactions);

      if (missing.length > 0) {
        setMissingCategories(missing);
        setSelectedCategoriesToCreate(new Set(missing)); // Todas selecionadas por padrão
        setShowCategoryDialog(true);
      } else {
        // Se não há categorias faltantes, importar diretamente
        await importFile(file, selectedAccountId);
      }
    } catch (error) {
      console.error("Erro na importação JSON:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo JSON",
        variant: "destructive"
      });
    }
  }, [file, selectedAccountId, user, processJSON, detectMissingCategories, importFile, toast]);

  const handleConfirmImport = useCallback(async () => {
    if (!file || !selectedAccountId || !user) return;

    try {
      // Criar categorias selecionadas
      const categoryMapping = new Map<string, string>();
      
      // Mapear categorias existentes
      if (categories) {
        categories.forEach(cat => {
          categoryMapping.set(cat.name.toLowerCase(), cat.id);
        });
      }

      // Criar novas categorias
      for (const categoryName of selectedCategoriesToCreate) {
        // Verificar se já existe (evitar duplicatas)
        const existingCategory = categories?.find(
          cat => cat.name.toLowerCase() === categoryName.toLowerCase()
        );

        if (existingCategory) {
          categoryMapping.set(categoryName.toLowerCase(), existingCategory.id);
        } else {
          // Criar nova categoria
          const { data, error } = await supabase
            .from('categories')
            .insert({
              user_id: user.id,
              name: categoryName,
              type: 'expense', // Tipo padrão
              color: '#6B7280' // Cor padrão
            })
            .select()
            .single();

          if (error) {
            console.error('Erro ao criar categoria:', error);
            toast({
              title: "Erro",
              description: `Erro ao criar categoria "${categoryName}"`,
              variant: "destructive"
            });
          } else if (data) {
            categoryMapping.set(categoryName.toLowerCase(), data.id);
            toast({
              title: "Categoria criada",
              description: `Categoria "${categoryName}" criada com sucesso`,
            });
          }
        }
      }

      // Fechar diálogo
      setShowCategoryDialog(false);

      // Importar com o mapeamento de categorias
      await importFile(file, selectedAccountId, categoryMapping);
    } catch (error) {
      console.error("Erro ao criar categorias:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar categorias",
        variant: "destructive"
      });
    }
  }, [file, selectedAccountId, user, categories, selectedCategoriesToCreate, importFile, toast]);

  const toggleCategorySelection = useCallback((categoryName: string) => {
    setSelectedCategoriesToCreate(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setSelectedAccountId("");
    setShowPreview(false);
    setPreviewData([]);
    reset();
  }, [reset]);

  const downloadTemplate = useCallback(() => {
    const jsonTemplate = {
      transactions: [
        {
          date: "2024-01-15",
          description: "Compra no supermercado",
          amount: 150.5,
          type: "expense",
          category: "Alimentação",
        },
        {
          date: "2024-01-16",
          description: "Salário",
          amount: 3000.0,
          type: "income",
          category: "Salário",
        },
        {
          date: "2024-01-17",
          description: "Combustível",
          amount: 80.0,
          type: "expense",
          category: "Transporte",
        },
        {
          date: "2024-01-18",
          description: "Freelance",
          amount: 500.0,
          type: "income",
          category: "Freelance",
        },
        {
          date: "2024-01-19",
          description: "Conta de luz",
          amount: 120.0,
          type: "expense",
          category: "Contas",
        },
      ],
    };

    const blob = new Blob([JSON.stringify(jsonTemplate, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_transacoes.json");
    link.style.visibility = "hidden";
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
            Importação JSON Concluída
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300 font-medium">
              Importação JSON concluída com sucesso!
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
            <Button onClick={handleReset} className="flex items-center gap-2 px-8 py-3 text-lg font-medium" size="lg">
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
                    {result.transactions.slice(0, 5).map((transaction, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">{transaction.date}</td>
                        <td className="px-3 py-2">{transaction.description}</td>
                        <td className="px-3 py-2">
                          <span className={transaction.type === "expense" ? "text-red-600" : "text-green-600"}>
                            R$ {transaction.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={transaction.type === "expense" ? "destructive" : "default"}>
                            {transaction.type === "expense" ? "Despesa" : "Receita"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{transaction.category || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.transactions.length > 5 && (
                  <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                    Mostrando 5 de {result.transactions.length} transações
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
    <>
      {/* Diálogo de categorias faltantes */}
      {showCategoryDialog && (
        <Card className="w-full max-w-4xl mx-auto mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-6 w-6" />
              Categorias não encontradas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/50">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                As seguintes categorias não existem no sistema. Selecione quais deseja criar:
              </AlertDescription>
            </Alert>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {missingCategories.map(categoryName => (
                <div
                  key={categoryName}
                  className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`category-${categoryName}`}
                    checked={selectedCategoriesToCreate.has(categoryName)}
                    onCheckedChange={() => toggleCategorySelection(categoryName)}
                  />
                  <label
                    htmlFor={`category-${categoryName}`}
                    className="flex-1 text-sm font-medium cursor-pointer"
                  >
                    {categoryName}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Nova
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirmImport}
                disabled={importing}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando e importando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Criar {selectedCategoriesToCreate.size} e Importar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCategoryDialog(false)}
                disabled={importing}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-6 w-6" />
            Importar do Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Botão para abrir o ChatGPT */}
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">Use o ChatGPT para gerar o arquivo JSON com suas transações</span>
            <Button
              variant="default"
              size="sm"
              className="ml-4 gap-2"
              asChild
            >
              <a
                href="https://chat.openai.com/g/g-68eaee304bfc8191a2cacfcc6374e2aa-fynance-ia"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="h-4 w-4" />
                Abrir Chat
              </a>
            </Button>
          </AlertDescription>
        </Alert>

        {/* Área de upload */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
            isDragOver ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10" : "border-border hover:border-blue-500/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("json-file-input")?.click()}
        >
          <input type="file" accept=".json" onChange={handleFileChange} className="hidden" id="json-file-input" />

          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="h-12 w-12 text-blue-500" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div
                  className={`p-4 rounded-full transition-colors duration-300 ${
                    isDragOver ? "bg-blue-500/10 dark:bg-blue-500/20" : "bg-muted/50 dark:bg-muted"
                  }`}
                >
                  <FileJson
                    className={`h-12 w-12 transition-colors duration-300 ${
                      isDragOver ? "text-blue-600" : "text-muted-foreground"
                    }`}
                  />
                </div>
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold transition-colors duration-300 ${
                    isDragOver ? "text-blue-600" : "text-foreground"
                  }`}
                >
                  {isDragOver ? "Solte o arquivo aqui" : "Selecione um arquivo JSON"}
                </h3>
                <p
                  className={`text-sm mt-2 transition-colors duration-300 ${
                    isDragOver ? "text-blue-600/80" : "text-muted-foreground"
                  }`}
                >
                  {isDragOver ? "Arquivo será processado automaticamente" : "ou arraste e solte aqui"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview dos dados */}
        {showPreview && previewData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-foreground">Preview dos Dados</h4>
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
                  {previewData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2">{row.description}</td>
                      <td className="px-3 py-2">
                        <span className={row.type === "expense" ? "text-red-600" : "text-green-600"}>
                          R$ {row.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={row.type === "expense" ? "destructive" : "default"}>
                          {row.type === "expense" ? "Despesa" : "Receita"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{row.category || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 5 && (
                <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                  Mostrando 5 de {previewData.length} transações
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seleção de conta */}
        <AccountSelector accounts={accounts} selectedAccountId={selectedAccountId} onSelect={setSelectedAccountId} />

        {/* Barra de progresso */}
        {importing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Importando transações...</span>
              <span className="font-medium text-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={!file || !selectedAccountId || importing}
            className="flex-1 h-12 text-base font-medium"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Importar Transações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default SimpleJSONImportComponent;
