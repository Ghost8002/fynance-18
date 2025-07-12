import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Save, Edit, Check, X, Loader2 } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import TagSelector from "@/components/shared/TagSelector";
import { format } from "date-fns";

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
  const { data: categories } = useSupabaseData('categories', user?.id);
  
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  
  const [treatedTransactions, setTreatedTransactions] = useState<TreatedTransaction[]>(
    transactions.map((transaction, index) => ({
      ...transaction,
      id: `temp-${index}`,
      category_id: getAutoCategory(transaction),
      tags: [],
      selected: false
    }))
  );

  const [bulkEdit, setBulkEdit] = useState({
    isOpen: false,
    date: '',
    category_id: '',
    tags: [] as string[]
  });

  // Função para determinar categoria automaticamente baseada na descrição
  function getAutoCategory(transaction: ImportedTransaction): string {
    if (!categories) return '';
    
    const description = transaction.description.toLowerCase();
    const availableCategories = categories.filter(cat => cat.type === transaction.type);
    
    // Mapeamento de palavras-chave para categorias
    const categoryKeywords: { [key: string]: string[] } = {
      'alimentação': ['mercado', 'supermercado', 'restaurante', 'lanchonete', 'padaria', 'açougue'],
      'transporte': ['combustivel', 'gasolina', 'uber', '99', 'taxi', 'onibus', 'metro'],
      'saúde': ['farmacia', 'hospital', 'clinica', 'medico', 'dentista', 'laboratorio'],
      'educação': ['escola', 'faculdade', 'curso', 'livro', 'material escolar'],
      'casa': ['aluguel', 'condominio', 'luz', 'agua', 'gas', 'internet', 'telefone'],
      'lazer': ['cinema', 'teatro', 'show', 'viagem', 'hotel', 'festa'],
      'roupas': ['loja', 'shopping', 'roupa', 'sapato', 'calcado'],
      'salário': ['salario', 'pagamento', 'remuneracao', 'ordenado'],
      'freelance': ['freelance', 'extra', 'bico', 'trabalho'],
    };

    // Procura por categoria baseada nas palavras-chave
    for (const category of availableCategories) {
      const categoryName = category.name.toLowerCase();
      const keywords = categoryKeywords[categoryName] || [categoryName];
      
      if (keywords.some(keyword => description.includes(keyword))) {
        return category.id;
      }
    }

    // Se não encontrou, retorna a primeira categoria do tipo
    return availableCategories[0]?.id || '';
  }

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
