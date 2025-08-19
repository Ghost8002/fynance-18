import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Save, 
  Edit, 
  Check, 
  X, 
  Loader2, 
  CheckCircle, 
  RefreshCw,
  Search,
  Filter,
  Eye,
  EyeOff,
  Zap,
  Settings,
  ArrowLeft,
  FileText,
  Database,
  Tag,
  TrendingUp,
  AlertTriangle,
  Info
} from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import TagSelector from "@/components/shared/TagSelector";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface OFXDataTreatmentProps {
  transactions: ImportedTransaction[];
  accountId: string;
  onSave: (treatedTransactions: TreatedTransaction[]) => void;
  onCancel: () => void;
}

const OFXDataTreatment = ({ transactions, accountId, onSave, onCancel }: OFXDataTreatmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: categories, refetch: refetchCategories } = useSupabaseData('categories', user?.id);

  // Estados principais
  const [autoCreateCategories, setAutoCreateCategories] = useState(false);
  const [creatingCategories, setCreatingCategories] = useState(false);
  const [creatingDefaultCategories, setCreatingDefaultCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [treatedTransactions, setTreatedTransactions] = useState<TreatedTransaction[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Estados de interface
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilters, setShowFilters] = useState(false);

  const initializedRef = useRef(false);
  const defaultCategoriesCreatedRef = useRef(false);

  // Inicializar transações
  useEffect(() => {
    if (categories && !categoriesLoaded && treatedTransactions.length === 0 && !initializedRef.current) {
      const initializeTransactions = async () => {
        initializedRef.current = true;
        const initializedTransactions = await Promise.all(
          transactions.map(async (transaction, index) => {
            return {
              ...transaction,
              id: `temp-${index}`,
              category_id: '',
              tags: [],
              selected: false
            };
          })
        );
        
        setTreatedTransactions(initializedTransactions);
        setCategoriesLoaded(true);
      };
      
      initializeTransactions();
    }
  }, [categories, categoriesLoaded, treatedTransactions.length, transactions]);

  // Criar categorias padrão
  useEffect(() => {
    const createDefaultCategories = async () => {
      if (categories && categories.length > 0) {
        defaultCategoriesCreatedRef.current = true;
        return;
      }
      
      if (user && categories && categories.length === 0 && !creatingDefaultCategories && !defaultCategoriesCreatedRef.current) {
        setCreatingDefaultCategories(true);
        
        const defaultCategories = [
          { name: 'Salário', type: 'income', color: '#10B981' },
          { name: 'Freelance', type: 'income', color: '#3B82F6' },
          { name: 'Investimentos', type: 'income', color: '#8B5CF6' },
          { name: 'Transferência Recebida', type: 'income', color: '#06B6D4' },
          { name: 'Outras Receitas', type: 'income', color: '#84CC16' },
          { name: 'Alimentação', type: 'expense', color: '#EF4444' },
          { name: 'Transporte', type: 'expense', color: '#F59E0B' },
          { name: 'Moradia', type: 'expense', color: '#8B5CF6' },
          { name: 'Saúde', type: 'expense', color: '#EC4899' },
          { name: 'Educação', type: 'expense', color: '#06B6D4' },
          { name: 'Lazer', type: 'expense', color: '#F97316' },
          { name: 'Shopping', type: 'expense', color: '#6366F1' },
          { name: 'Contas', type: 'expense', color: '#84CC16' },
          { name: 'Transferência Enviada', type: 'expense', color: '#F59E0B' },
          { name: 'Investimentos', type: 'expense', color: '#8B5CF6' },
          { name: 'Outras Despesas', type: 'expense', color: '#6B7280' },
        ];

        try {
          for (const category of defaultCategories) {
            const { data: existingCategory } = await supabase
              .from('categories')
              .select('id, name, type')
              .eq('user_id', user.id)
              .eq('name', category.name)
              .eq('type', category.type)
              .single();

            if (!existingCategory) {
              await supabase
                .from('categories')
                .insert({
                  name: category.name,
                  type: category.type,
                  user_id: user.id,
                  color: category.color,
                  sort_order: 999
                });
            }
          }

          await refetchCategories();
          defaultCategoriesCreatedRef.current = true;
          
        } catch (error) {
          console.error('Erro ao criar categorias padrão:', error);
        } finally {
          setCreatingDefaultCategories(false);
        }
      }
    };

    createDefaultCategories();
  }, [user, categories, refetchCategories, creatingDefaultCategories]);

  // Função para categorização automática
  async function getAutoCategory(transaction: ImportedTransaction): Promise<string> {
    if (!categories || categories.length === 0) return '';
    
    const description = transaction.description.toLowerCase();
    const availableCategories = categories.filter(cat => cat.type === transaction.type);
    
    const keywordToCategoryMap: { [key: string]: string } = {
      'transferência recebida pelo pix': 'Transferência Recebida',
      'transferência enviada pelo pix': 'Transferência Enviada',
      'transferência recebida': 'Transferência Recebida',
      'transferência enviada': 'Transferência Enviada',
      'pix': 'Transferência',
      'mercado': 'Alimentação',
      'supermercado': 'Alimentação',
      'restaurante': 'Alimentação',
      'lanchonete': 'Alimentação',
      'padaria': 'Alimentação',
      'posto': 'Transporte',
      'combustivel': 'Transporte',
      'gasolina': 'Transporte',
      'uber': 'Transporte',
      'farmacia': 'Saúde',
      'hospital': 'Saúde',
      'escola': 'Educação',
      'universidade': 'Educação',
      'cinema': 'Lazer',
      'energia': 'Contas',
      'agua': 'Contas',
      'internet': 'Contas',
      'investimento': 'Investimentos',
    };

    for (const [keyword, categoryName] of Object.entries(keywordToCategoryMap)) {
      if (description.includes(keyword)) {
        const category = availableCategories.find(cat => cat.name === categoryName);
        if (category) return category.id;
      }
    }

    return '';
  }

  // Aplicar categorização automática
  const applyAutoCategorization = async () => {
    if (!autoCreateCategories) {
      toast({
        title: "Categorização Automática",
        description: "Ative a criação automática de categorias primeiro!",
        variant: "destructive",
      });
      return;
    }

    if (!categories || categories.length === 0) {
      toast({
        title: "Aguardando Categorias",
        description: "Aguarde as categorias padrão serem criadas...",
        variant: "destructive",
      });
      return;
    }

    setCreatingCategories(true);
    try {
      const updatedTransactions = await Promise.all(
        treatedTransactions.map(async (transaction) => {
          if (!transaction.category_id) {
            const newCategoryId = await getAutoCategory(transaction);
            if (newCategoryId) {
              return { ...transaction, category_id: newCategoryId };
            }
          }
          return transaction;
        })
      );
      
      setTreatedTransactions(updatedTransactions);
      
      if (user) {
        await refetchCategories();
      }
      
      toast({
        title: "Categorização Aplicada",
        description: "Transações categorizadas automaticamente!",
      });
      
    } catch (error) {
      console.error('Erro ao aplicar categorização:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar categorização automática.",
        variant: "destructive",
      });
    } finally {
      setCreatingCategories(false);
    }
  };

  // Funções de manipulação
  const handleTransactionChange = (id: string, field: string, value: any) => {
    setTreatedTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id 
          ? { ...transaction, [field]: value }
          : transaction
      )
    );
  };

  const handleSelectTransaction = (id: string, selected: boolean) => {
    setTreatedTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id 
          ? { ...transaction, selected }
          : transaction
      )
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setTreatedTransactions(prev => 
      prev.map(transaction => ({ ...transaction, selected }))
    );
  };

  // Filtros
  const filteredTransactions = treatedTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesCategory = !categoryFilter || transaction.category_id === categoryFilter;
    const matchesUncategorized = !showOnlyUncategorized || !transaction.category_id;
    
    return matchesSearch && matchesType && matchesCategory && matchesUncategorized;
  });

  const selectedTransactions = treatedTransactions.filter(t => t.selected);
  const uncategorizedCount = treatedTransactions.filter(t => !t.category_id).length;
  const categorizedCount = treatedTransactions.filter(t => t.category_id).length;

  // Estatísticas
  const totalAmount = treatedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const incomeAmount = treatedTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenseAmount = treatedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Salvamento
  const handleSave = async () => {
    const transactionsToSave = treatedTransactions.filter(t => t.selected);
    
    if (transactionsToSave.length === 0) {
      toast({
        title: "Nenhuma Transação Selecionada",
        description: "Selecione pelo menos uma transação para importar.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setSaveProgress(0);

    try {
      await onSave(transactionsToSave);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Ocorreu um erro ao salvar as transações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total de Transações</p>
                <p className="text-2xl font-bold text-blue-700">{treatedTransactions.length}</p>
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
                <p className="text-sm text-green-600 font-medium">Receitas</p>
                <p className="text-2xl font-bold text-green-700">R$ {incomeAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white rotate-180" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Despesas</p>
                <p className="text-2xl font-bold text-red-700">R$ {expenseAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Categorizadas</p>
                <p className="text-2xl font-bold text-purple-700">{categorizedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card principal */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Tratamento de Dados OFX
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Revise e categorize suas transações antes da importação
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                className="flex items-center gap-2"
              >
                {viewMode === 'table' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {viewMode === 'table' ? 'Cards' : 'Tabela'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filtros */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar transações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uncategorized"
                    checked={showOnlyUncategorized}
                    onCheckedChange={(checked) => setShowOnlyUncategorized(checked as boolean)}
                  />
                  <label htmlFor="uncategorized" className="text-sm text-gray-700">
                    Apenas não categorizadas
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Barra de ações */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-700">
                {selectedTransactions.length} de {filteredTransactions.length} selecionadas
              </span>
            </div>

            <div className="flex items-center gap-2">
              {uncategorizedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyAutoCategorization}
                  disabled={creatingCategories || !autoCreateCategories}
                  className="flex items-center gap-2"
                >
                  {creatingCategories ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Categorização Automática
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoCreateCategories(!autoCreateCategories)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {autoCreateCategories ? 'Desativar' : 'Ativar'} Auto-Categorização
              </Button>
            </div>
          </div>

          {/* Informações sobre categorização automática */}
          {autoCreateCategories && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <strong>Categorização Automática Ativada:</strong> As transações serão automaticamente 
                categorizadas com base em palavras-chave encontradas nas descrições. 
                {uncategorizedCount > 0 && (
                  <span className="block mt-1">
                    {uncategorizedCount} transações aguardando categorização automática.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Progresso de salvamento */}
          {saving && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando transações...
                </span>
                <span className="font-medium">{saveProgress}%</span>
              </div>
              <Progress value={saveProgress} className="w-full h-2" />
            </div>
          )}

          {/* Tabela de transações */}
          {viewMode === 'table' ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Checkbox
                          checked={transaction.selected}
                          onCheckedChange={(checked) => 
                            handleSelectTransaction(transaction.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          type="date"
                          value={transaction.date}
                          onChange={(e) => 
                            handleTransactionChange(transaction.id, 'date', e.target.value)
                          }
                          className="w-36"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          value={transaction.description}
                          onChange={(e) => 
                            handleTransactionChange(transaction.id, 'description', e.target.value)
                          }
                          className="min-w-48"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <span className={`font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          value={transaction.category_id || ''}
                          onValueChange={(value) => 
                            handleTransactionChange(transaction.id, 'category_id', value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              ?.filter(cat => cat.type === transaction.type)
                              .map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <div className="w-40">
                          <TagSelector
                            selectedTags={transaction.tags}
                            onTagsChange={(tags) => 
                              handleTransactionChange(transaction.id, 'tags', tags)
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Visualização em cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className={`p-4 ${transaction.selected ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <Checkbox
                      checked={transaction.selected}
                      onCheckedChange={(checked) => 
                        handleSelectTransaction(transaction.id, checked as boolean)
                      }
                    />
                    <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Data</label>
                      <Input
                        type="date"
                        value={transaction.date}
                        onChange={(e) => 
                          handleTransactionChange(transaction.id, 'date', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500">Descrição</label>
                      <Input
                        value={transaction.description}
                        onChange={(e) => 
                          handleTransactionChange(transaction.id, 'description', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500">Valor</label>
                      <p className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500">Categoria</label>
                      <Select
                        value={transaction.category_id || ''}
                        onValueChange={(value) => 
                          handleTransactionChange(transaction.id, 'category_id', value)
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            ?.filter(cat => cat.type === transaction.type)
                            .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500">Tags</label>
                      <TagSelector
                        selectedTags={transaction.tags}
                        onTagsChange={(tags) => 
                          handleTransactionChange(transaction.id, 'tags', tags)
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            <Button onClick={handleSave} className="flex items-center gap-2" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar {selectedTransactions.length} Transações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OFXDataTreatment;
