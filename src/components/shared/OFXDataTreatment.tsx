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

  const [creatingNewCategories, setCreatingNewCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
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

  

  // Função para categorização automática
  async function getAutoCategory(transaction: ImportedTransaction): Promise<string> {
    if (!categories || categories.length === 0) return '';
    
    const description = transaction.description.toLowerCase();
    const availableCategories = categories.filter(cat => cat.type === transaction.type);
    
    const keywordToCategoryMap: { [key: string]: string } = {
      // Transferências
      'transferência recebida pelo pix': 'Transferência Recebida',
      'transferência enviada pelo pix': 'Transferência Enviada',
      'transferência recebida': 'Transferência Recebida',
      'transferência enviada': 'Transferência Enviada',
      'pix recebido': 'Transferência Recebida',
      'pix enviado': 'Transferência Enviada',
      // 'pix': 'Transferência Recebida', // REMOVIDO - usar apenas pix recebido/enviado
      'ted': 'Transferência Recebida',
      'doc': 'Transferência Recebida',
      
      // Alimentação
      'mercado': 'Alimentação',
      'supermercado': 'Alimentação',
      'restaurante': 'Alimentação',
      'lanchonete': 'Alimentação',
      'padaria': 'Alimentação',
      'ifood': 'Alimentação',
      'rappi': 'Alimentação',
      'uber eats': 'Alimentação',
      'mcdonalds': 'Alimentação',
      'burger king': 'Alimentação',
      'subway': 'Alimentação',
      'starbucks': 'Alimentação',
      'café': 'Alimentação',
      'lanche': 'Alimentação',
      'pizza': 'Alimentação',
      'hambúrguer': 'Alimentação',
      
      // Transporte
      'posto': 'Transporte',
      'combustivel': 'Transporte',
      'gasolina': 'Transporte',
      'etanol': 'Transporte',
      'diesel': 'Transporte',
      'uber': 'Transporte',
      '99': 'Transporte',
      'taxi': 'Transporte',
      'metro': 'Transporte',
      'ônibus': 'Transporte',
      'estacionamento': 'Transporte',
      'pedágio': 'Transporte',
      'ipva': 'Transporte',
      'licenciamento': 'Transporte',
      'multa': 'Transporte',
      
      // Saúde
      'farmacia': 'Saúde',
      'farmácia': 'Saúde',
      'hospital': 'Saúde',
      'clínica': 'Saúde',
      'médico': 'Saúde',
      'dentista': 'Saúde',
      'consulta': 'Saúde',
      'exame': 'Saúde',
      'medicamento': 'Saúde',
      'plano de saúde': 'Saúde',
      'unimed': 'Saúde',
      'amil': 'Saúde',
      
      // Educação
      'escola': 'Educação',
      'universidade': 'Educação',
      'faculdade': 'Educação',
      'curso': 'Educação',
      'livro': 'Educação',
      'material escolar': 'Educação',
      'mensalidade': 'Educação',
      'matrícula': 'Educação',
      
      // Lazer
      'cinema': 'Lazer',
      'teatro': 'Lazer',
      'show': 'Lazer',
      'festival': 'Lazer',
      'viagem': 'Lazer',
      'hotel': 'Lazer',
      'airbnb': 'Lazer',
      'netflix': 'Lazer',
      'spotify': 'Lazer',
      'youtube': 'Lazer',
      'jogo': 'Lazer',
      'academia': 'Lazer',
      'esporte': 'Lazer',
      
      // Contas
      'energia': 'Contas',
      'água': 'Contas',
      'agua': 'Contas',
      'internet': 'Contas',
      'telefone': 'Contas',
      'celular': 'Contas',
      'tv': 'Contas',
      'gás': 'Contas',
      'gas': 'Contas',
      'condomínio': 'Contas',
      'condominio': 'Contas',
      'iptu': 'Contas',
      
      // Shopping
      'shopping': 'Shopping',
      'mall': 'Shopping',
      'loja': 'Shopping',
      'roupa': 'Shopping',
      'calçado': 'Shopping',
      'calcado': 'Shopping',
      'acessório': 'Shopping',
      'acessorio': 'Shopping',
      'eletrônico': 'Shopping',
      'eletronico': 'Shopping',
      'amazon': 'Shopping',
      'magazine luiza': 'Shopping',
      'americanas': 'Shopping',
      
      // Investimentos
      'investimento': 'Investimentos',
      'ação': 'Investimentos',
      'acao': 'Investimentos',
      'fii': 'Investimentos',
      'tesouro': 'Investimentos',
      'cdb': 'Investimentos',
      'lci': 'Investimentos',
      'lca': 'Investimentos',
      'cripto': 'Investimentos',
      'bitcoin': 'Investimentos',
      'ethereum': 'Investimentos',
      
      // Receitas
      'salário': 'Salário',
      'salario': 'Salário',
      'pagamento': 'Salário',
      'depósito': 'Salário',
      'deposito': 'Salário',
      'freelance': 'Freelance',
      'bico': 'Freelance',
      'projeto': 'Freelance',
      'dividendo': 'Investimentos',
      'rendimento': 'Investimentos',
      'juros': 'Investimentos',
    };

    // Verificar palavras-chave mais específicas primeiro
    for (const [keyword, categoryName] of Object.entries(keywordToCategoryMap)) {
      if (description.includes(keyword)) {
        const category = availableCategories.find(cat => cat.name === categoryName);
        if (category) {
          console.log(`Categoria encontrada para "${description}": ${categoryName}`);
          return category.id;
        }
      }
    }

    return '';
  }

  // Função para criar categoria baseada na descrição da transação
  async function createCategoryFromDescription(transaction: ImportedTransaction): Promise<string> {
    if (!user) return '';

    const description = transaction.description;
    
    // Extrair o nome da empresa/estabelecimento da descrição
    let categoryName = '';
    
    // Padrões comuns para extrair o nome da empresa
    const patterns = [
      /^([^-–—]+)/, // Tudo antes do primeiro hífen
      /^([^0-9]+)/, // Tudo antes do primeiro número
      /^([A-Za-z\s]+)/, // Apenas letras e espaços no início
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted.length > 2 && extracted.length < 50) {
          categoryName = extracted;
          break;
        }
      }
    }

    // Se não conseguiu extrair, usar uma parte da descrição
    if (!categoryName) {
      categoryName = description.substring(0, 30).trim();
    }

    // Limpar o nome da categoria
    categoryName = categoryName
      .replace(/[^\w\s]/g, '') // Remover caracteres especiais
      .replace(/\s+/g, ' ') // Normalizar espaços
      .trim();

    if (categoryName.length < 2) {
      console.log(`Nome de categoria muito curto: "${categoryName}" da descrição: "${description}"`);
      return '';
    }

    console.log(`Tentando criar/encontrar categoria: "${categoryName}" para transação: "${description}"`);

    // Verificação robusta contra duplicatas - sempre buscar dados atualizados
    const { data: existingCategories, error: searchError } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', user.id)
      .eq('type', transaction.type);

    if (searchError) {
      console.error('Erro ao verificar categorias existentes:', searchError);
      return '';
    }

    // Verificar se já existe uma categoria com nome exato (case-insensitive)
    const exactMatch = existingCategories?.find(cat => 
      cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
    );

    if (exactMatch) {
      console.log(`✓ Categoria exata já existe: "${exactMatch.name}" (ID: ${exactMatch.id})`);
      return exactMatch.id;
    }

    // Verificar se existe uma categoria muito similar (para evitar duplicatas próximas)
    const similarMatch = existingCategories?.find(cat => {
      const catName = cat.name.toLowerCase().trim();
      const newName = categoryName.toLowerCase().trim();
      
      // Verificações de similaridade mais rigorosas
      if (catName === newName) return true;
      
      // Se uma categoria contém a outra (com pelo menos 3 caracteres)
      if (catName.length >= 3 && newName.length >= 3) {
        return catName.includes(newName) || newName.includes(catName);
      }
      
      return false;
    });

    if (similarMatch) {
      console.log(`✓ Categoria similar já existe: "${similarMatch.name}" (ID: ${similarMatch.id}), usando ela em vez de criar "${categoryName}"`);
      return similarMatch.id;
    }

    // Dupla verificação antes de criar - verificar novamente se não foi criada por outro processo
    const { data: doubleCheckCategories } = await supabase
              .from('categories')
              .select('id, name, type')
              .eq('user_id', user.id)
              .eq('type', transaction.type)
      .eq('name', categoryName);

    if (doubleCheckCategories && doubleCheckCategories.length > 0) {
      console.log(`✓ Categoria foi criada por outro processo: "${doubleCheckCategories[0].name}" (ID: ${doubleCheckCategories[0].id})`);
      return doubleCheckCategories[0].id;
    }

    // Criar nova categoria com tratamento de erro de constraint
    const colors = [
      '#10B981', '#3B82F6', '#8B5CF6', '#06B6D4', '#84CC16',
      '#EF4444', '#F59E0B', '#EC4899', '#F97316', '#6366F1'
    ];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    console.log(`🔄 Criando nova categoria: "${categoryName}" (${transaction.type})`);
            
            const { data: newCategory, error } = await supabase
              .from('categories')
              .insert({
                name: categoryName,
                type: transaction.type,
                user_id: user.id,
        color: randomColor,
                sort_order: 999
              })
              .select()
              .single();

            if (error) {
      console.error(`❌ Erro ao criar categoria "${categoryName}":`, error);
      
      // Se erro de constraint (categoria já existe), tentar buscar a categoria existente
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        console.log(`🔍 Tentando encontrar categoria existente após erro de duplicata...`);
        
        const { data: existingCategory } = await supabase
                .from('categories')
          .select('id, name, type')
          .eq('user_id', user.id)
          .eq('type', transaction.type)
          .eq('name', categoryName)
          .single();

        if (existingCategory) {
          console.log(`✓ Encontrada categoria existente após erro: "${existingCategory.name}" (ID: ${existingCategory.id})`);
          return existingCategory.id;
        }
      }
      
      return '';
    }

    if (newCategory) {
      console.log(`✅ Nova categoria criada com sucesso: "${categoryName}" (ID: ${newCategory.id}, ${transaction.type})`);
              return newCategory.id;
            }

    return '';
  }

  // Aplicar categorização automática com categorias existentes
  const applyAutoCategorization = async () => {
    if (!categories || categories.length === 0) {
      toast({
        title: "Nenhuma Categoria Disponível",
        description: "Crie categorias primeiro ou use 'Criar Categorias' para criar baseadas na descrição.",
        variant: "destructive",
      });
      return;
    }

    setCreatingCategories(true);
    try {
      let categorizedCount = 0;
      const updatedTransactions = await Promise.all(
        treatedTransactions.map(async (transaction) => {
          if (!transaction.category_id) {
            const newCategoryId = await getAutoCategory(transaction);
            if (newCategoryId) {
              categorizedCount++;
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
      
      if (categorizedCount > 0) {
        toast({
          title: "Categorização Aplicada",
          description: `${categorizedCount} transações foram categorizadas automaticamente!`,
        });
      } else {
        toast({
          title: "Nenhuma Categoria Encontrada",
          description: "Nenhuma transação pôde ser categorizada automaticamente.",
          variant: "destructive",
        });
      }
      
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

  // Criar categorias automaticamente baseadas na descrição
  const createCategoriesFromDescriptions = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    setCreatingNewCategories(true);
    try {
      let createdCount = 0;
      let categorizedCount = 0;
      const updatedTransactions = [...treatedTransactions];
      
      // Processar transações sequencialmente para evitar race conditions
      for (let i = 0; i < updatedTransactions.length; i++) {
        const transaction = updatedTransactions[i];
        
        if (!transaction.category_id) {
          console.log(`Processando transação: ${transaction.description}`);
          
          const newCategoryId = await createCategoryFromDescription(transaction);
          if (newCategoryId) {
            // Verificar se esta é uma categoria nova ou existente
            const isNewCategory = !categories?.find(cat => cat.id === newCategoryId);
            
            if (isNewCategory) {
              createdCount++;
              // Recarregar categorias após criar uma nova para evitar duplicatas
              await refetchCategories();
            }
            
            categorizedCount++;
            updatedTransactions[i] = { ...transaction, category_id: newCategoryId };
            
            console.log(`Transação categorizada: ${transaction.description} → ${newCategoryId}`);
          }
        }
      }
      
      setTreatedTransactions(updatedTransactions);
      
      // Recarregar categorias final para garantir sincronização
      await refetchCategories();
      
      if (categorizedCount > 0) {
        toast({
          title: "Categorias Criadas",
          description: `${createdCount} novas categorias foram criadas e ${categorizedCount} transações categorizadas!`,
        });
      } else {
        toast({
          title: "Nenhuma Categoria Criada",
          description: "Todas as transações já possuem categorias ou não foi possível criar novas categorias.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Erro ao criar categorias:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar categorias automaticamente.",
        variant: "destructive",
      });
    } finally {
      setCreatingNewCategories(false);
    }
  };

  // Aplicar categorização automática quando autoCreateCategories for ativado
  useEffect(() => {
    if (autoCreateCategories && categories && categories.length > 0 && treatedTransactions.length > 0) {
      // Aplicar categorização automaticamente após um pequeno delay
      const timer = setTimeout(() => {
        applyAutoCategorization();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoCreateCategories, categories?.length, treatedTransactions.length]);

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

  // Salvamento com progresso em tempo real
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
    setSaveStatus('Iniciando salvamento...');

    try {
      // Simular progresso em tempo real
      const totalSteps = transactionsToSave.length;
      let currentStep = 0;

      const updateProgress = () => {
        currentStep++;
        const progress = Math.round((currentStep / totalSteps) * 100);
        setSaveProgress(progress);
        
        if (currentStep <= totalSteps) {
          setSaveStatus(`Salvando transação ${currentStep} de ${totalSteps}...`);
        }
      };

      // Criar uma versão modificada do onSave que atualiza o progresso
      const saveWithProgress = async (transactions: TreatedTransaction[]) => {
        // Simular o processo de salvamento com progresso
        for (let i = 0; i < transactions.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Simular delay
          updateProgress();
        }
        
        // Chamar o onSave original
        await onSave(transactions);
      };

      await saveWithProgress(transactionsToSave);
      setSaveStatus('Salvamento concluído com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveStatus('Erro durante o salvamento');
      toast({
        title: "Erro ao Salvar",
        description: "Ocorreu um erro ao salvar as transações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setTimeout(() => {
      setSaveProgress(0);
        setSaveStatus('');
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
                </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total de Transações</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{treatedTransactions.length}</p>
              </div>
            </div>
          </CardContent>
            </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Receitas</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">R$ {incomeAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white rotate-180" />
                  </div>
                  <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Despesas</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">R$ {expenseAmount.toFixed(2)}</p>
                    </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Tag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Categorizadas</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{categorizedCount}</p>
                    </div>
                  </div>
          </CardContent>
        </Card>
                </div>
                
      {/* Card principal */}
      <Card className="w-full border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
                    <Button
                variant="outline"
                      size="sm"
                onClick={onCancel}
                disabled={saving}
                className="flex items-center gap-2 hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
                    </Button>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Tratamento de Dados OFX
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Revise e categorize suas transações antes da importação
                </p>
                  </div>
              </div>
            
            <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                onClick={() => setShowFilters(!showFilters)}
                disabled={saving}
                className="flex items-center gap-2 hover:bg-muted/50"
              >
                <Filter className="h-4 w-4" />
                Filtros
                </Button>
              
                <Button
                  variant="outline"
                  size="sm"
                onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                disabled={saving}
                className="flex items-center gap-2 hover:bg-muted/50"
                >
                {viewMode === 'table' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {viewMode === 'table' ? 'Cards' : 'Tabela'}
                </Button>

              {/* Botão de salvar movido para o header */}
              <Button 
                onClick={handleSave} 
                disabled={saving || selectedTransactions.length === 0}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar ({selectedTransactions.length})
                  </>
                )}
              </Button>
              </div>
            </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progresso de salvamento em tempo real */}
          {saving && (
            <div className="space-y-3 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {saveStatus}
                </span>
                <span className="font-medium text-foreground">{saveProgress}%</span>
              </div>
              <Progress value={saveProgress} className="w-full h-2" />
            </div>
          )}

          {/* Filtros */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 dark:bg-muted rounded-lg border border-border">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Buscar transações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                  </div>
                  
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
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
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-background border-border text-foreground">
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
                <label className="text-sm font-medium text-foreground">Status</label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uncategorized"
                    checked={showOnlyUncategorized}
                    onCheckedChange={(checked) => setShowOnlyUncategorized(checked as boolean)}
                  />
                  <label htmlFor="uncategorized" className="text-sm text-foreground">
                    Apenas não categorizadas
                  </label>
                  </div>
                </div>
            </div>
          )}

          {/* Barra de ações */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                onCheckedChange={handleSelectAll}
                disabled={saving}
              />
              <span className="text-sm text-foreground">
                {selectedTransactions.length} de {filteredTransactions.length} selecionadas
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={applyAutoCategorization}
                disabled={creatingCategories || saving || uncategorizedCount === 0}
                className="flex items-center gap-2 hover:bg-muted/50"
              >
                {creatingCategories ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Categorização Automática ({uncategorizedCount})
                  </Button>

                  <Button 
                variant="outline"
                    size="sm" 
                onClick={createCategoriesFromDescriptions}
                disabled={creatingNewCategories || saving || uncategorizedCount === 0}
                className="flex items-center gap-2 hover:bg-muted/50"
              >
                {creatingNewCategories ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4" />
                )}
                Criar Categorias ({uncategorizedCount})
              </Button>



              <Button
                    variant="outline" 
                size="sm"
                onClick={() => setAutoCreateCategories(!autoCreateCategories)}
                disabled={saving}
                className={`flex items-center gap-2 hover:bg-muted/50 ${
                  autoCreateCategories ? 'bg-primary/10 border-primary/30' : ''
                }`}
              >
                <Settings className="h-4 w-4" />
                {autoCreateCategories ? 'Desativar' : 'Ativar'} Auto-Categorização
                  </Button>
                </div>
          </div>

          {/* Informações sobre categorização automática */}
          {autoCreateCategories && (
            <Alert className="bg-primary/5 dark:bg-primary/10 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground">
                <strong>Categorização Automática Ativada:</strong> As transações serão automaticamente 
                categorizadas com base em palavras-chave encontradas nas descrições usando categorias existentes. 
                {uncategorizedCount > 0 ? (
                  <span className="block mt-1">
                    {uncategorizedCount} transações aguardando categorização automática. 
                    Use "Categorização Automática" para aplicar com categorias existentes ou "Criar Categorias" para criar novas categorias baseadas na descrição.
                  </span>
                ) : (
                  <span className="block mt-1 text-green-600 dark:text-green-400">
                    ✓ Todas as transações foram categorizadas automaticamente!
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Informações quando auto-categorização não está ativada */}
          {!autoCreateCategories && uncategorizedCount > 0 && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <strong>Categorização Manual:</strong> {uncategorizedCount} transações aguardando categorização. 
                <div className="mt-2 space-y-1">
                  <p>• <strong>"Categorização Automática"</strong> - Usa categorias existentes com palavras-chave</p>
                  <p>• <strong>"Criar Categorias"</strong> - Cria novas categorias baseadas na descrição</p>
                  <p>• <strong>"Auto-Categorização"</strong> - Ativa categorização automática em tempo real</p>
          </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Informação sobre falta de categorias */}
          {(!categories || categories.length === 0) && (
            <Alert className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <strong>Nenhuma Categoria Encontrada:</strong> Para começar a categorizar suas transações, 
                use "Criar Categorias" para criar categorias personalizadas baseadas nas descrições das transações.
              </AlertDescription>
            </Alert>
          )}

          {/* Tabela de transações */}
          {viewMode === 'table' ? (
            <div className="border border-border rounded-lg overflow-hidden bg-background">
            <Table>
              <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-muted">
                    <TableHead className="w-12 text-foreground"></TableHead>
                    <TableHead className="text-foreground">Data</TableHead>
                    <TableHead className="text-foreground">Descrição</TableHead>
                    <TableHead className="text-foreground">Tipo</TableHead>
                    <TableHead className="text-foreground">Valor</TableHead>
                    <TableHead className="text-foreground">Categoria</TableHead>
                    <TableHead className="text-foreground">Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50 dark:hover:bg-muted">
                    <TableCell>
                      <Checkbox
                        checked={transaction.selected}
                        onCheckedChange={(checked) => 
                          handleSelectTransaction(transaction.id, checked as boolean)
                        }
                          disabled={saving}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Input
                        type="date"
                        value={transaction.date}
                        onChange={(e) => 
                          handleTransactionChange(transaction.id, 'date', e.target.value)
                        }
                          className="w-36 bg-background border-border text-foreground"
                          disabled={saving}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Input
                        value={transaction.description}
                        onChange={(e) => 
                          handleTransactionChange(transaction.id, 'description', e.target.value)
                        }
                          className="min-w-48 bg-background border-border text-foreground"
                          disabled={saving}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className={`font-medium ${
                          transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
                          disabled={saving}
                      >
                          <SelectTrigger className="w-40 bg-background border-border text-foreground">
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
                <Card key={transaction.id} className={`p-4 border-border bg-card ${transaction.selected ? 'ring-2 ring-primary' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <Checkbox
                      checked={transaction.selected}
                      onCheckedChange={(checked) => 
                        handleSelectTransaction(transaction.id, checked as boolean)
                      }
                      disabled={saving}
                    />
                    <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
          </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Data</label>
                      <Input
                        type="date"
                        value={transaction.date}
                        onChange={(e) => 
                          handleTransactionChange(transaction.id, 'date', e.target.value)
                        }
                        className="text-sm bg-background border-border text-foreground"
                        disabled={saving}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                      <Input
                        value={transaction.description}
                        onChange={(e) => 
                          handleTransactionChange(transaction.id, 'description', e.target.value)
                        }
                        className="text-sm bg-background border-border text-foreground"
                        disabled={saving}
                      />
          </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Valor</label>
                      <p className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                      <Select
                        value={transaction.category_id || ''}
                        onValueChange={(value) => 
                          handleTransactionChange(transaction.id, 'category_id', value)
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="text-sm bg-background border-border text-foreground">
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
                      <label className="text-xs font-medium text-muted-foreground">Tags</label>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default OFXDataTreatment;
