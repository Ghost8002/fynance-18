import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Save, Edit, Check, X, Loader2, CheckCircle, RefreshCw } from "lucide-react";
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
  console.log('=== OFXDataTreatment RENDERIZADO ===');
  console.log('Props recebidas:', {
    transactionsCount: transactions?.length || 0,
    accountId,
    transactions: transactions?.slice(0, 3) // Mostrar apenas as primeiras 3 para debug
  });
  
  const { user } = useAuth();

  // Log quando usuário muda
  useEffect(() => {
    console.log('Usuário carregado:', user?.id ? 'Sim' : 'Não');
  }, [user]);
  const { data: categories, refetch: refetchCategories } = useSupabaseData('categories', user?.id);

  // Estado para controle de criação automática de categorias
  const [autoCreateCategories, setAutoCreateCategories] = useState(false);
  const [creatingCategories, setCreatingCategories] = useState(false);
  const [creatingDefaultCategories, setCreatingDefaultCategories] = useState(false);
  const [createdCategories, setCreatedCategories] = useState<string[]>([]);

  // Log quando categorias mudam
  useEffect(() => {
    console.log('Categorias carregadas:', categories?.length || 0, 'categorias');
    if (categories && categories.length > 0) {
      console.log('Primeiras categorias:', categories.slice(0, 3).map(c => ({ id: c.id, name: c.name, type: c.type })));
    }
  }, [categories]);

  // Verificar se já existem categorias para evitar criação duplicada
  useEffect(() => {
    if (categories && categories.length > 0) {
      defaultCategoriesCreatedRef.current = true;
      console.log('Categorias já existem, marcando como criadas');
    }
  }, [categories]);

  // Verificar se o usuário já tem categorias no banco
  useEffect(() => {
    const checkExistingCategories = async () => {
      if (user && !defaultCategoriesCreatedRef.current) {
        try {
          const { data: existingCategories } = await supabase
            .from('categories')
            .select('id, name, type')
            .eq('user_id', user.id);

          if (existingCategories && existingCategories.length > 0) {
            defaultCategoriesCreatedRef.current = true;
            console.log('Usuário já tem categorias no banco, marcando como criadas');
          }
        } catch (error) {
          console.error('Erro ao verificar categorias existentes:', error);
        }
      }
    };

    checkExistingCategories();
  }, [user]);

  // Criar categorias padrão se o usuário não tiver nenhuma
  useEffect(() => {
    const createDefaultCategories = async () => {
      // Verificar se já temos categorias ou se já foram criadas
      if (categories && categories.length > 0) {
        defaultCategoriesCreatedRef.current = true;
        return;
      }
      
      if (user && categories && categories.length === 0 && !creatingDefaultCategories && !defaultCategoriesCreatedRef.current) {
        console.log('=== CRIANDO CATEGORIAS PADRÃO ===');
        setCreatingDefaultCategories(true);
        
        const defaultCategories = [
          // Receitas
          { name: 'Salário', type: 'income', color: '#10B981' },
          { name: 'Freelance', type: 'income', color: '#3B82F6' },
          { name: 'Investimentos', type: 'income', color: '#8B5CF6' },
          { name: 'Transferência Recebida', type: 'income', color: '#06B6D4' },
          { name: 'Outras Receitas', type: 'income', color: '#84CC16' },
          
          // Despesas
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
            // Verificar se a categoria já existe antes de criar
            const { data: existingCategory } = await supabase
              .from('categories')
              .select('id, name, type')
              .eq('user_id', user.id)
              .eq('name', category.name)
              .eq('type', category.type)
              .single();

            if (existingCategory) {
              console.log(`Categoria já existe: ${category.name} (${category.type})`);
              continue;
            }

            const { data: newCategory, error } = await supabase
              .from('categories')
              .insert({
                name: category.name,
                type: category.type,
                user_id: user.id,
                color: category.color,
                sort_order: 999
              })
              .select()
              .single();

            if (error) {
              console.error(`Erro ao criar categoria ${category.name}:`, error);
            } else {
              console.log(`Categoria padrão criada: ${category.name} (${category.type})`);
            }
          }

          // Atualizar a lista de categorias
          await refetchCategories();
          console.log('=== CATEGORIAS PADRÃO CRIADAS ===');
          defaultCategoriesCreatedRef.current = true;
          
        } catch (error) {
          console.error('Erro ao criar categorias padrão:', error);
        } finally {
          setCreatingDefaultCategories(false);
        }
      }
    };

    createDefaultCategories();
  }, [user, categories, refetchCategories]); // Removido creatingDefaultCategories das dependências
  
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  
  const [treatedTransactions, setTreatedTransactions] = useState<TreatedTransaction[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const initializedRef = useRef(false);
  const defaultCategoriesCreatedRef = useRef(false);

  // Garantir que o estado categoriesLoaded seja mantido durante a sessão
  useEffect(() => {
    if (categories && categories.length > 0 && !categoriesLoaded) {
      setCategoriesLoaded(true);
    }
  }, [categories, categoriesLoaded]);

  const [bulkEdit, setBulkEdit] = useState({
    isOpen: false,
    date: '',
    category_id: '',
    tags: [] as string[]
  });

  // Log quando autoCreateCategories muda
  useEffect(() => {
    console.log('autoCreateCategories mudou para:', autoCreateCategories);
  }, [autoCreateCategories]);

  const { toast } = useToast();

  // Inicializar transações com categorização automática quando as categorias carregarem
  useEffect(() => {
    console.log('=== INICIALIZAÇÃO DE TRANSAÇÕES ===');
    console.log('Estado atual:', {
      categories: categories?.length || 0,
      categoriesLoaded,
      treatedTransactionsLength: treatedTransactions.length,
      initializedRef: initializedRef.current,
      transactionsLength: transactions.length
    });
    
    if (categories && !categoriesLoaded && treatedTransactions.length === 0 && !initializedRef.current) {
      const initializeTransactions = async () => {
        console.log('Inicializando transações...');
        initializedRef.current = true;
        const initializedTransactions = await Promise.all(
          transactions.map(async (transaction, index) => {
            // Durante a inicialização, NÃO aplicar categorização automática
            // Apenas criar a estrutura básica
            return {
              ...transaction,
              id: `temp-${index}`,
              category_id: '', // Deixar vazio para categorização posterior
              tags: [],
              selected: false
            };
          })
        );
        
        console.log('Transações inicializadas:', initializedTransactions.length);
        setTreatedTransactions(initializedTransactions);
        setCategoriesLoaded(true);
      };
      
      initializeTransactions();
    }
  }, [categories, categoriesLoaded, treatedTransactions.length]); // Adicionado treatedTransactions.length para evitar re-inicialização

  // Função para aplicar categorização automática a todas as transações
  const applyAutoCategorization = async () => {
    console.log('=== INICIANDO CATEGORIZAÇÃO AUTOMÁTICA ===');
    console.log('Estado atual:', {
      autoCreateCategories,
      categoriesCount: categories?.length || 0,
      transactionsCount: treatedTransactions.length,
      categorizedCount: treatedTransactions.filter(t => t.category_id).length,
      uncategorizedCount: treatedTransactions.filter(t => !t.category_id).length,
      user: user?.id
    });

    if (!autoCreateCategories) {
      toast({
        title: "Categorização Automática",
        description: "Ative a criação automática de categorias primeiro!",
        variant: "destructive",
      });
      return;
    }

    // Verificar se há categorias disponíveis
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
      console.log('=== APLICANDO CATEGORIZAÇÃO AUTOMÁTICA ===');
      
      const updatedTransactions = await Promise.all(
        treatedTransactions.map(async (transaction) => {
          console.log(`Processando: ${transaction.description}`);
          
          if (!transaction.category_id) {
            const newCategoryId = await getAutoCategory(transaction);
            console.log(`Categoria encontrada: ${newCategoryId}`);
            
            if (newCategoryId) {
              return { ...transaction, category_id: newCategoryId };
            }
          }
          return transaction;
        })
      );
      
      setTreatedTransactions(updatedTransactions);
      
      // Atualizar a lista de categorias disponíveis
      if (user) {
        const { data: updatedCategories } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id);
        
        if (updatedCategories) {
          // Atualizar o estado das categorias usando a função refetch
          await refetchCategories();
          console.log('Categorias atualizadas:', updatedCategories);
          
          // Manter o estado categoriesLoaded para evitar re-inicialização
          if (!categoriesLoaded) {
            setCategoriesLoaded(true);
          }
        }
      }
      
      toast({
        title: "Categorização Aplicada",
        description: "Transações categorizadas automaticamente!",
      });
      
      console.log('=== CATEGORIZAÇÃO CONCLUÍDA ===');
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

  // Função para gerar cor aleatória para categorias
  const getRandomColor = (): string => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Função unificada para determinar categoria automaticamente baseada na descrição
  async function getAutoCategory(transaction: ImportedTransaction): Promise<string> {
    console.log(`getAutoCategory: Processando transação: "${transaction.description}" (${transaction.type})`);
    console.log(`getAutoCategory: Categorias disponíveis:`, categories?.map(c => ({ id: c.id, name: c.name, type: c.type })));
    
    if (!categories || categories.length === 0) {
      console.log('getAutoCategory: Nenhuma categoria disponível - aguardando criação de categorias padrão');
      return '';
    }
    
    const description = transaction.description.toLowerCase();
    const availableCategories = categories.filter(cat => cat.type === transaction.type);
    
    console.log(`getAutoCategory: Categorias disponíveis para ${transaction.type}:`, availableCategories.map(c => c.name));
    
    if (availableCategories.length === 0) {
      console.log('getAutoCategory: Nenhuma categoria disponível para o tipo:', transaction.type);
      return '';
    }
    
    // Mapeamento unificado de palavras-chave para categorias - BASEADO NO ARQUIVO OFX REAL
    const keywordToCategoryMap: { [key: string]: string } = {
      // === TRANSFERÊNCIAS PIX ===
      'transferência recebida pelo pix': 'Transferência Recebida',
      'transferência enviada pelo pix': 'Transferência Enviada',
      'transferência recebida': 'Transferência Recebida',
      'transferência enviada': 'Transferência Enviada',
      'pix': 'Transferência',
      
      // === COMPRAS E ESTABELECIMENTOS ===
      'compra no débito': 'Compras',
      'mercado': 'Alimentação',
      'supermercado': 'Alimentação',
      'restaurante': 'Alimentação',
      'lanchonete': 'Alimentação',
      'padaria': 'Alimentação',
      'açougue': 'Alimentação',
      'panificadora': 'Alimentação',
      'sorvetes': 'Alimentação',
      'verduras': 'Alimentação',
      'delicias caseira': 'Alimentação',
      'chiquinho sorvetes': 'Alimentação',
      'milky moo': 'Alimentação',
      'paraíso das verduras': 'Alimentação',
      'panificadora 2 irmaos': 'Alimentação',
      'panificadora doce mana': 'Alimentação',
      'silvestrevazde': 'Alimentação',
      'anesia nunes': 'Alimentação',
      'central mix': 'Alimentação',
      'mp *anesiarua jose mar': 'Alimentação',
      
      // === SHOPPING E VESTUÁRIO ===
      'imperatriz imperial sh': 'Shopping',
      'imperatriz imperial shopping': 'Shopping',
      'loja': 'Vestuário',
      'roupa': 'Vestuário',
      'sapato': 'Vestuário',
      'calcado': 'Vestuário',
      'acessorio': 'Vestuário',
      
      // === TRANSPORTE ===
      'posto': 'Transporte',
      'posto canoeiro': 'Transporte',
      'combustivel': 'Transporte',
      'gasolina': 'Transporte',
      'uber': 'Transporte',
      '99': 'Transporte',
      'taxi': 'Transporte',
      'onibus': 'Transporte',
      'metro': 'Transporte',
      'estacionamento': 'Transporte',
      
      // === SAÚDE ===
      'farmacia': 'Saúde',
      'hospital': 'Saúde',
      'clinica': 'Saúde',
      'medico': 'Saúde',
      'dentista': 'Saúde',
      'laboratorio': 'Saúde',
      'consulta': 'Saúde',
      
      // === EDUCAÇÃO ===
      'escola': 'Educação',
      'faculdade': 'Educação',
      'curso': 'Educação',
      'livro': 'Educação',
      'material escolar': 'Educação',
      'universidade': 'Educação',
      
      // === CASA E MORADIA ===
      'aluguel': 'Moradia',
      'condominio': 'Moradia',
      'luz': 'Contas',
      'agua': 'Contas',
      'gas': 'Contas',
      'internet': 'Contas',
      'telefone': 'Contas',
      'iptu': 'Contas',
      
      // === LAZER ===
      'cinema': 'Lazer',
      'teatro': 'Lazer',
      'show': 'Lazer',
      'viagem': 'Lazer',
      'hotel': 'Lazer',
      'festa': 'Lazer',
      'bar': 'Lazer',
      'balada': 'Lazer',
      
      // === INVESTIMENTOS ===
      'aplicação rdb': 'Investimentos',
      'resgate rdb': 'Investimentos',
      'rdb': 'Investimentos',
      'investimento': 'Investimentos',
      'aplicação': 'Investimentos',
      'resgate': 'Investimentos',
      
      // === MARKETPLACE E ONLINE ===
      'pix marketplace': 'Compras Online',
      'mercado pago': 'Compras Online',
      'marketplace': 'Compras Online',
      'online': 'Compras Online',
      
      // === SERVIÇOS ===
      'servico': 'Serviços',
      'manutencao': 'Manutenção',
      'reparo': 'Reparo',
      'limpeza': 'Limpeza',
      'seguranca': 'Segurança',
      'consultoria': 'Serviços',
      'contabilidade': 'Serviços',
      
      // === RECEITAS ===
      'salario': 'Salário',
      'pagamento': 'Pagamento',
      'remuneracao': 'Remuneração',
      'ordenado': 'Salário',
      'bonus': 'Bônus',
      'comissao': 'Comissão',
      'freelance': 'Freelance',
      'extra': 'Trabalho Extra',
      'bico': 'Trabalho Extra',
      
      // === OUTROS ===
      'presente': 'Presentes',
      'doacao': 'Doações',
      'multa': 'Multas',
      'imposto': 'Impostos',
      'seguro': 'Seguros',
    };

    console.log(`getAutoCategory: Procurando por palavras-chave em: "${description}"`);
    console.log(`getAutoCategory: Criação automática ativada: ${autoCreateCategories}`);
    console.log(`getAutoCategory: Mapeamento de palavras-chave:`, Object.keys(keywordToCategoryMap));

    // Estratégia 1: Buscar por frases completas (mais específicas)
    let keywordFound = false;
    for (const [keyword, categoryName] of Object.entries(keywordToCategoryMap)) {
      if (description.includes(keyword)) {
        keywordFound = true;
        console.log(`getAutoCategory: Palavra-chave encontrada: "${keyword}" -> "${categoryName}"`);
        
        // Verificar se a categoria já existe
        console.log(`getAutoCategory: Procurando categoria existente: "${categoryName}"`);
        console.log(`getAutoCategory: Categorias disponíveis para ${transaction.type}:`, availableCategories.map(c => c.name));
        
        const existingCategory = availableCategories.find(cat => 
          cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (existingCategory) {
          console.log(`getAutoCategory: Categoria existente encontrada: "${categoryName}" -> ${existingCategory.id}`);
          return existingCategory.id;
        } else {
          console.log(`getAutoCategory: Categoria não encontrada: "${categoryName}"`);
        }
        
        // Se criação automática estiver ativada, criar nova categoria
        if (autoCreateCategories && user) {
          console.log(`getAutoCategory: Criando nova categoria: "${categoryName}"`);
          
          // Verificar se a categoria já existe no banco antes de criar
          try {
            const { data: existingCategory } = await supabase
              .from('categories')
              .select('id, name, type')
              .eq('user_id', user.id)
              .eq('name', categoryName)
              .eq('type', transaction.type)
              .single();

            if (existingCategory) {
              console.log(`getAutoCategory: Categoria já existe no banco: ${categoryName} (${transaction.type}) -> ${existingCategory.id}`);
              return existingCategory.id;
            }

            console.log(`getAutoCategory: Dados da categoria:`, {
              name: categoryName,
              type: transaction.type,
              user_id: user.id,
              color: getRandomColor(),
              sort_order: 999
            });
            
            const { data: newCategory, error } = await supabase
              .from('categories')
              .insert({
                name: categoryName,
                type: transaction.type,
                user_id: user.id,
                color: getRandomColor(),
                sort_order: 999
              })
              .select()
              .single();

            if (error) {
              console.error('Erro ao criar categoria:', error);
              console.error('Detalhes do erro:', error);
            } else if (newCategory) {
              console.log(`getAutoCategory: Nova categoria criada: ${categoryName} (${transaction.type}) -> ${newCategory.id}`);
              setCreatedCategories(prev => [...prev, newCategory.id]);
              
              // Atualizar a lista de categorias disponíveis
              const { data: updatedCategories } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', user.id);
              
              if (updatedCategories) {
                // Atualizar o estado das categorias usando a função refetch
                await refetchCategories();
                console.log('Categorias atualizadas:', updatedCategories);
                
                // Manter o estado categoriesLoaded para evitar re-inicialização
                if (!categoriesLoaded) {
                  setCategoriesLoaded(true);
                }
              }
              
              return newCategory.id;
            }
          } catch (error) {
            console.error('Erro ao verificar/criar categoria:', error);
          }
        } else {
          console.log(`getAutoCategory: Criação automática desativada para: "${categoryName}"`);
        }
      }
    }
    
    if (!keywordFound) {
      console.log(`getAutoCategory: Nenhuma palavra-chave encontrada para: "${description}"`);
    }

    // Estratégia 2: Buscar por nome exato da categoria existente
    console.log(`getAutoCategory: Estratégia 2 - Buscando por nome exato de categoria`);
    for (const category of availableCategories) {
      const categoryName = category.name.toLowerCase();
      if (description.includes(categoryName)) {
        console.log(`getAutoCategory: Categoria encontrada por nome exato: "${categoryName}" -> ${category.id}`);
        return category.id;
      }
    }
    console.log(`getAutoCategory: Estratégia 2 - Nenhuma categoria encontrada por nome exato`);

    // Estratégia 3: Buscar por palavras similares
    console.log(`getAutoCategory: Estratégia 3 - Buscando por palavras similares`);
    for (const category of availableCategories) {
      const categoryName = category.name.toLowerCase();
      const categoryWords = categoryName.split(' ');
      
      const matchingWord = categoryWords.find(word => 
        word.length > 2 && description.includes(word)
      );
      
      if (matchingWord) {
        console.log(`getAutoCategory: Categoria encontrada por palavra similar: "${categoryName}" -> ${category.id} (word: "${matchingWord}")`);
        return category.id;
      }
    }
    console.log(`getAutoCategory: Estratégia 3 - Nenhuma categoria encontrada por palavras similares`);

    // Estratégia 4: Categoria padrão do tipo
    console.log(`getAutoCategory: Estratégia 4 - Usando categoria padrão`);
    const defaultCategory = availableCategories[0]?.id || '';
    console.log(`getAutoCategory: Usando categoria padrão: ${defaultCategory} (${availableCategories[0]?.name || 'N/A'})`);
    return defaultCategory;
  }

  // Função para verificar se uma categoria foi aplicada automaticamente
  const isAutoCategorized = (transaction: TreatedTransaction): boolean => {
    if (!transaction.category_id) return false;
    
    // Para simplificar, vamos considerar que todas as categorias aplicadas durante a sessão
    // são automáticas, já que o usuário não pode editar manualmente durante o processo
    return true;
  };

  const getDefaultCategory = (type: 'income' | 'expense') => {
    const defaultCategories = categories?.filter(cat => cat.type === type);
    return defaultCategories?.[0]?.id || '';
  };

  const handleSelectTransaction = (id: string, selected: boolean) => {
    setTreatedTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id ? { ...transaction, selected } : transaction
      )
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setTreatedTransactions(prev => 
      prev.map(transaction => ({ ...transaction, selected }))
    );
  };

  const handleTransactionChange = (id: string, field: string, value: any) => {
    setTreatedTransactions(prev =>
      prev.map(transaction =>
        transaction.id === id ? { ...transaction, [field]: value } : transaction
      )
    );
  };

  const handleBulkEdit = () => {
    const selectedIds = treatedTransactions
      .filter(t => t.selected)
      .map(t => t.id);

    if (selectedIds.length === 0) return;

    setTreatedTransactions(prev =>
      prev.map(transaction => {
        if (selectedIds.includes(transaction.id)) {
          const updates: any = {};
          if (bulkEdit.date) updates.date = bulkEdit.date;
          if (bulkEdit.category_id) updates.category_id = bulkEdit.category_id;
          if (bulkEdit.tags.length > 0) updates.tags = bulkEdit.tags;
          
          return { ...transaction, ...updates };
        }
        return transaction;
      })
    );

    setBulkEdit({ isOpen: false, date: '', category_id: '', tags: [] });
  };

  const selectedCount = treatedTransactions.filter(t => t.selected).length;

  const handleSave = async () => {
    setSaving(true);
    setSaveProgress(0);

    // Simular progresso durante o processamento
    const progressInterval = setInterval(() => {
      setSaveProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Aplicar categorias padrão para transações sem categoria
      const finalTransactions = treatedTransactions.map(transaction => ({
        ...transaction,
        category_id: transaction.category_id || getDefaultCategory(transaction.type)
      }));
      
      setSaveProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequena pausa para mostrar 100%
      
      onSave(finalTransactions);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      clearInterval(progressInterval);
      setSaving(false);
      setSaveProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Tratamento de Dados - {treatedTransactions.length} transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Barra de progresso do salvamento */}
          {saving && (
            <Card className="mb-4 p-4 bg-blue-50">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando transações...
                  </span>
                  <span>{saveProgress}%</span>
                </div>
                <Progress value={saveProgress} className="w-full" />
              </div>
            </Card>
          )}

          {/* Controle de criação automática de categorias */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-green-800">Criação Automática de Categorias</h3>
                <p className="text-sm text-green-600">
                  {autoCreateCategories 
                    ? 'Ativado - O sistema criará categorias automaticamente baseado nas descrições das transações'
                    : 'Desativado - Apenas categorias existentes serão usadas'
                  }
                </p>
                {createdCategories.length > 0 && (
                  <p className="text-sm text-green-700 font-medium">
                    ✅ {createdCategories.length} categoria(s) criada(s) automaticamente
                  </p>
                )}
                {creatingDefaultCategories && (
                  <p className="text-sm text-blue-700 font-medium">
                    🔄 Criando categorias padrão...
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={autoCreateCategories ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    console.log('Botão de ativação clicado. Estado atual:', autoCreateCategories);
                    setAutoCreateCategories(!autoCreateCategories);
                  }}
                  disabled={creatingCategories}
                  className={autoCreateCategories ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {autoCreateCategories ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Ativado
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-1" />
                      Ativar
                    </>
                  )}
                </Button>
                
                {autoCreateCategories && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      console.log('Botão de categorização automática clicado');
                      applyAutoCategorization();
                    }}
                    disabled={creatingCategories}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {creatingCategories ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Aplicar Categorização Automática
                  </Button>
                )}
              </div>
            </div>
            
            {/* Estatísticas de categorização */}
            {treatedTransactions.length > 0 && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Estatísticas de Categorização</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {treatedTransactions.filter(t => t.category_id).length}
                    </div>
                    <div className="text-xs text-gray-600">Categorizadas</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {treatedTransactions.filter(t => !t.category_id).length}
                    </div>
                    <div className="text-xs text-gray-600">Sem Categoria</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {createdCategories.length}
                    </div>
                    <div className="text-xs text-gray-600">Criadas</div>
                  </div>
                </div>
                
                {/* Botão de ação principal */}
                {autoCreateCategories && treatedTransactions.filter(t => !t.category_id).length > 0 && (
                  <div className="mt-3 text-center">
                    <Button
                      onClick={() => {
                        console.log('Botão principal de categorização clicado');
                        applyAutoCategorization();
                      }}
                      disabled={creatingCategories}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {creatingCategories ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Aplicando Categorização...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Categorizar {treatedTransactions.filter(t => !t.category_id).length} Transações Automaticamente
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Controles de seleção e edição em lote */}
          <div className="mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedCount === treatedTransactions.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">
                  {selectedCount > 0 ? `${selectedCount} selecionadas` : 'Selecionar todas'}
                </span>
              </div>
              
              <div className="flex gap-2">
                {/* Botão de teste de categorização */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('=== TESTE DE CATEGORIZAÇÃO AUTOMÁTICA ===');
                    console.log('Estado atual:', {
                      autoCreateCategories,
                      categoriesCount: categories?.length || 0,
                      transactionsCount: treatedTransactions.length,
                      categorizedCount: treatedTransactions.filter(t => t.category_id).length,
                      uncategorizedCount: treatedTransactions.filter(t => !t.category_id).length
                    });
                    treatedTransactions.forEach((transaction, index) => {
                      console.log(`Transação ${index + 1}:`, {
                        description: transaction.description,
                        type: transaction.type,
                        category_id: transaction.category_id,
                        category_name: categories?.find(c => c.id === transaction.category_id)?.name || 'N/A'
                      });
                    });
                    console.log('=== FIM DO TESTE ===');
                  }}
                >
                  Testar Categorização
                </Button>
              
              {selectedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkEdit(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                >
                  Editar em Lote ({selectedCount})
                </Button>
              )}
              </div>
            </div>

            {/* Painel de edição em lote */}
            {bulkEdit.isOpen && (
              <Card className="p-4 bg-blue-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Data</label>
                    <Input
                      type="date"
                      value={bulkEdit.date}
                      onChange={(e) => setBulkEdit(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Categoria</label>
                    <Select
                      value={bulkEdit.category_id}
                      onValueChange={(value) => setBulkEdit(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <TagSelector
                      selectedTags={bulkEdit.tags}
                      onTagsChange={(tags) => setBulkEdit(prev => ({ ...prev, tags }))}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={handleBulkEdit}>
                    <Check className="h-4 w-4 mr-1" />
                    Aplicar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setBulkEdit({ isOpen: false, date: '', category_id: '', tags: [] })}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Tabela de transações */}
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
                {treatedTransactions.map((transaction) => (
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
                      
                      {/* Indicador de categorização automática */}
                      {transaction.category_id && (
                        <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {isAutoCategorized(transaction) 
                            ? 'Categorizada automaticamente' 
                            : 'Categoria manual'
                          }
                        </div>
                      )}
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

          {/* Botões de ação */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onCancel} disabled={saving}>
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
                  Salvar {treatedTransactions.length} Transações
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
