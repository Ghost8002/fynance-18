import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Tag, 
  Folder,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';

interface ValidationItem {
  name: string;
  type: 'category' | 'tag';
  count: number;
  action: 'create' | 'ignore';
}

interface CategoryTagValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (items: ValidationItem[]) => void;
  categories: ValidationItem[];
  tags: ValidationItem[];
}

const CategoryTagValidationModal: React.FC<CategoryTagValidationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categories,
  tags
}) => {
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Inicializar items quando modal abre
  React.useEffect(() => {
    if (isOpen) {
      setValidationItems([...categories, ...tags]);
    }
  }, [isOpen, categories, tags]);

  const handleItemActionChange = (index: number, action: 'create' | 'ignore') => {
    const updatedItems = [...validationItems];
    updatedItems[index].action = action;
    setValidationItems(updatedItems);
  };

  const handleConfirm = () => {
    onConfirm(validationItems);
    onClose();
  };

  const handleSelectAll = (action: 'create' | 'ignore') => {
    const updatedItems = validationItems.map(item => ({
      ...item,
      action
    }));
    setValidationItems(updatedItems);
  };

  const getItemIcon = (type: 'category' | 'tag') => {
    return type === 'category' ? <Folder className="h-4 w-4" /> : <Tag className="h-4 w-4" />;
  };

  const getItemColor = (type: 'category' | 'tag') => {
    return type === 'category' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400';
  };

  const getActionBadge = (action: 'create' | 'ignore') => {
    return action === 'create' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <Plus className="h-3 w-3 mr-1" />
        Criar
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
        <X className="h-3 w-3 mr-1" />
        Ignorar
      </Badge>
    );
  };

  if (!isOpen) return null;

  const totalItems = validationItems.length;
  const createCount = validationItems.filter(item => item.action === 'create').length;
  const ignoreCount = validationItems.filter(item => item.action === 'ignore').length;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-background border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-6 w-6" />
            Validação de Categorias e Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Alerta informativo */}
          <Alert className="bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              <strong>Encontradas {totalItems} categorias e tags que não existem no sistema.</strong><br />
              Escolha como deseja proceder para cada item antes de continuar a importação.
            </AlertDescription>
          </Alert>

          {/* Controles de seleção em massa */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll('create')}
              className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Criar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll('ignore')}
              className="text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <X className="h-4 w-4 mr-2" />
              Ignorar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
            </Button>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-center border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalItems}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-lg text-center border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{createCount}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Serão Criados</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-950/50 rounded-lg text-center border border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{ignoreCount}</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Serão Ignorados</div>
            </div>
          </div>

          {/* Lista de itens */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Itens Encontrados:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validationItems.map((item, index) => (
                <div key={`${item.type}-${item.name}`} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`${getItemColor(item.type)}`}>
                      {getItemIcon(item.type)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.type === 'category' ? 'Categoria' : 'Tag'} • {item.count} ocorrência(s)
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getActionBadge(item.action)}
                    
                    <div className="flex gap-2">
                      <Button
                        variant={item.action === 'create' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleItemActionChange(index, 'create')}
                        className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/50"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Criar
                      </Button>
                      <Button
                        variant={item.action === 'ignore' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleItemActionChange(index, 'ignore')}
                        className="text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Ignorar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Informações adicionais */}
          {showDetails && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h5 className="font-semibold text-foreground mb-2">Detalhes:</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Criar:</strong> O item será adicionado ao sistema automaticamente</li>
                <li>• <strong>Ignorar:</strong> O item será removido das transações importadas</li>
                <li>• Você pode alterar as escolhas a qualquer momento antes de confirmar</li>
                <li>• Apenas itens marcados como "Criar" serão adicionados ao sistema</li>
              </ul>
            </div>
          )}
        </CardContent>
        
        {/* Botões de ação */}
        <div className="border-t border-border p-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar Importação
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmar e Continuar
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CategoryTagValidationModal;
