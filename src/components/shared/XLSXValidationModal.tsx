import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Check, 
  Plus,
  MapPin,
  SkipForward,
  Loader2,
  FileText,
  Tag,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { 
  XLSXValidationResult, 
  CategoryMapping, 
  XLSXTransaction,
  XLSXCategory 
} from "@/utils/xlsxProcessor";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface XLSXValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: XLSXValidationResult;
  categoryMappings: CategoryMapping[];
  transactions: XLSXTransaction[];
  categories: XLSXCategory[];
  onProceed: (mappings: CategoryMapping[], autoCreate: boolean) => void;
  onSkipTreatment: () => void;
}

const XLSXValidationModal = ({
  isOpen,
  onClose,
  validationResult,
  categoryMappings,
  transactions,
  categories,
  onProceed,
  onSkipTreatment
}: XLSXValidationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: existingCategories, refetch: refetchCategories } = useSupabaseData('categories', user?.id);

  const [mappings, setMappings] = useState<CategoryMapping[]>(categoryMappings);
  const [autoCreateCategories, setAutoCreateCategories] = useState(false);
  const [creatingCategories, setCreatingCategories] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'proceed' | 'skip' | null>(null);

  useEffect(() => {
    setMappings(categoryMappings);
  }, [categoryMappings]);

  const handleMappingChange = (index: number, action: 'create' | 'map' | 'ignore') => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      action,
      systemId: action === 'map' ? newMappings[index].systemId : undefined
    };
    setMappings(newMappings);
  };

  const handleCategorySelect = (index: number, categoryId: string) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      systemId: categoryId,
      action: 'map'
    };
    setMappings(newMappings);
  };

  const handleCreateCategories = async () => {
    if (!user) return;

    setCreatingCategories(true);
    try {
      const categoriesToCreate = mappings.filter(m => m.action === 'create');
      const createdCategories: { [key: string]: string } = {};

      for (const mapping of categoriesToCreate) {
        const categoryData = categories.find(c => 
          c.name.toLowerCase() === mapping.xlsxName.toLowerCase()
        );

        if (categoryData) {
          const colors = [
            '#10B981', '#3B82F6', '#8B5CF6', '#06B6D4', '#84CC16',
            '#EF4444', '#F59E0B', '#EC4899', '#F97316', '#6366F1'
          ];
          
          const randomColor = colors[Math.floor(Math.random() * colors.length)];

          const { data: newCategory, error } = await supabase
            .from('categories')
            .insert({
              name: mapping.xlsxName,
              type: categoryData.type,
              user_id: user.id,
              color: randomColor,
              sort_order: 999
            })
            .select()
            .single();

          if (error) {
            console.error(`Erro ao criar categoria "${mapping.xlsxName}":`, error);
            toast({
              title: "Erro ao Criar Categoria",
              description: `Não foi possível criar a categoria "${mapping.xlsxName}".`,
              variant: "destructive",
            });
          } else if (newCategory) {
            createdCategories[mapping.xlsxName] = newCategory.id;
            console.log(`✅ Categoria criada: "${mapping.xlsxName}" (ID: ${newCategory.id})`);
          }
        }
      }

      // Atualizar mappings com IDs das categorias criadas
      const updatedMappings = mappings.map(mapping => {
        if (mapping.action === 'create' && createdCategories[mapping.xlsxName]) {
          return {
            ...mapping,
            systemId: createdCategories[mapping.xlsxName],
            action: 'map' as const
          };
        }
        return mapping;
      });

      setMappings(updatedMappings);
      await refetchCategories();

      toast({
        title: "Categorias Criadas",
        description: `${categoriesToCreate.length} categorias foram criadas com sucesso!`,
      });

    } catch (error) {
      console.error('Erro ao criar categorias:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar categorias automaticamente.",
        variant: "destructive",
      });
    } finally {
      setCreatingCategories(false);
    }
  };

  const handleProceed = () => {
    setSelectedAction('proceed');
    if (autoCreateCategories) {
      handleCreateCategories().then(() => {
        onProceed(mappings, true);
      });
    } else {
      onProceed(mappings, false);
    }
  };

  const handleSkip = () => {
    setSelectedAction('skip');
    onSkipTreatment();
  };

  const canSkipTreatment = validationResult.isValid && 
    validationResult.warnings.length === 0 && 
    mappings.every(m => m.action !== 'create');

  const hasNewCategories = mappings.some(m => m.action === 'create');
  const hasWarnings = validationResult.warnings.length > 0;
  const hasErrors = validationResult.errors.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Validação e Mapeamento de Categorias
          </DialogTitle>
          <DialogDescription>
            Revise os dados extraídos e configure o mapeamento de categorias antes da importação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo da Validação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Resumo da Validação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {validationResult.statistics.total_transactions}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {validationResult.statistics.valid_transactions}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Válidas</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {validationResult.statistics.invalid_transactions}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Inválidas</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {validationResult.statistics.new_categories}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Novas Categorias</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          {hasErrors && (
            <Alert className="bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                <strong>Erros encontrados:</strong> {validationResult.errors.length} transações com problemas.
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {validationResult.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-sm">• {error}</div>
                  ))}
                  {validationResult.errors.length > 5 && (
                    <div className="text-sm">... e mais {validationResult.errors.length - 5} erros</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {hasWarnings && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <strong>Avisos:</strong> {validationResult.warnings.length} avisos encontrados.
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {validationResult.warnings.slice(0, 5).map((warning, index) => (
                    <div key={index} className="text-sm">• {warning}</div>
                  ))}
                  {validationResult.warnings.length > 5 && (
                    <div className="text-sm">... e mais {validationResult.warnings.length - 5} avisos</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mapeamento de Categorias */}
          {mappings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Mapeamento de Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mappings.map((mapping, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{mapping.xlsxName}</div>
                        <div className="text-sm text-muted-foreground">
                          Categoria do XLSX
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={mapping.action === 'create' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleMappingChange(index, 'create')}
                          disabled={creatingCategories}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Criar
                        </Button>
                        
                        <Button
                          variant={mapping.action === 'map' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleMappingChange(index, 'map')}
                          disabled={creatingCategories}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Mapear
                        </Button>
                        
                        <Button
                          variant={mapping.action === 'ignore' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleMappingChange(index, 'ignore')}
                          disabled={creatingCategories}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Ignorar
                        </Button>
                      </div>

                      {mapping.action === 'map' && (
                        <select
                          value={mapping.systemId || ''}
                          onChange={(e) => handleCategorySelect(index, e.target.value)}
                          className="p-2 border rounded-md"
                          disabled={creatingCategories}
                        >
                          <option value="">Selecionar categoria...</option>
                          {existingCategories
                            ?.filter(cat => cat.type === categories.find(c => c.name === mapping.xlsxName)?.type)
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </select>
                      )}

                      {mapping.action === 'create' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Nova categoria
                        </Badge>
                      )}

                      {mapping.action === 'ignore' && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          Ignorada
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Opção de criar automaticamente */}
                {hasNewCategories && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="auto-create"
                        checked={autoCreateCategories}
                        onChange={(e) => setAutoCreateCategories(e.target.checked)}
                        disabled={creatingCategories}
                      />
                      <label htmlFor="auto-create" className="text-sm font-medium">
                        Criar novas categorias automaticamente
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      As categorias marcadas como "Criar" serão criadas automaticamente no sistema.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview das Transações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Preview das Transações ({transactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {transactions.slice(0, 10).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.date} • {transaction.category || 'Sem categoria'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        transaction.type === 'income' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                      </div>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {transactions.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    ... e mais {transactions.length - 10} transações
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={creatingCategories || selectedAction !== null}
          >
            Cancelar
          </Button>

          {canSkipTreatment && (
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={creatingCategories || selectedAction !== null}
              className="flex items-center gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Importar Direto
            </Button>
          )}

          <Button
            onClick={handleProceed}
            disabled={creatingCategories || selectedAction !== null || hasErrors}
            className="flex items-center gap-2"
          >
            {creatingCategories ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando Categorias...
              </>
            ) : selectedAction === 'proceed' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Continuar para Tratamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default XLSXValidationModal;
