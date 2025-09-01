import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Info, 
  X, 
  Check, 
  Plus,
  SkipForward,
  FileText,
  Tag,
  TrendingUp
} from "lucide-react";
import { 
  CategoryMapping, 
  TagMapping,
  XLSXTransaction
} from "@/utils/xlsxProcessor";

interface XLSXCategoryMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryMappings: CategoryMapping[];
  tagMappings: TagMapping[];
  transactions: XLSXTransaction[];
  onProceed: (categoryMappings: CategoryMapping[], tagMappings: TagMapping[], autoCreate: boolean) => void;
  onSkipMapping: () => void;
}

const XLSXCategoryMappingModal: React.FC<XLSXCategoryMappingModalProps> = ({
  isOpen,
  onClose,
  categoryMappings,
  tagMappings,
  transactions,
  onProceed,
  onSkipMapping
}) => {
  const [autoCreateCategories, setAutoCreateCategories] = React.useState(false);
  const [autoCreateTags, setAutoCreateTags] = React.useState(false);

  const unmappedCategories = categoryMappings.filter(m => m.action === 'create');
  const unmappedTags = tagMappings.filter(t => t.action === 'create');

  const handleProceed = () => {
    onProceed(categoryMappings, tagMappings, autoCreateCategories || autoCreateTags);
  };

  const handleSkip = () => {
    onSkipMapping();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mapeamento de Categorias e Tags
          </DialogTitle>
          <DialogDescription>
            Revise e configure como as categorias e tags da planilha devem ser mapeadas para o sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{transactions.length}</strong> transacoes encontradas na planilha.
              {categoryMappings.length > 0 && (
                <span> <strong>{categoryMappings.length}</strong> categorias detectadas.</span>
              )}
              {tagMappings.length > 0 && (
                <span> <strong>{tagMappings.length}</strong> tags detectadas.</span>
              )}
            </AlertDescription>
          </Alert>

          {/* Categorias */}
          {categoryMappings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Categorias ({categoryMappings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={mapping.type === 'income' ? 'default' : 'secondary'}>
                          {mapping.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                        <span className="font-medium">{mapping.xlsxName}</span>
                        <Badge variant="outline">{mapping.count} transacoes</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {mapping.action === 'map' && (
                        <Badge variant="outline" className="text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Mapeada
                        </Badge>
                      )}
                      {mapping.action === 'create' && (
                        <Badge variant="outline" className="text-blue-600">
                          <Plus className="h-3 w-3 mr-1" />
                          Nova categoria
                        </Badge>
                      )}
                      {mapping.action === 'ignore' && (
                        <Badge variant="outline" className="text-gray-600">
                          <X className="h-3 w-3 mr-1" />
                          Ignorada
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {unmappedCategories.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="auto-create-categories"
                      checked={autoCreateCategories}
                      onChange={(e) => setAutoCreateCategories(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="auto-create-categories" className="text-sm">
                      Criar automaticamente {unmappedCategories.length} categorias nao mapeadas
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {tagMappings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags ({tagMappings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tagMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{mapping.xlsxName}</span>
                        <Badge variant="outline">{mapping.count} transacoes</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {mapping.action === 'map' && (
                        <Badge variant="outline" className="text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Mapeada
                        </Badge>
                      )}
                      {mapping.action === 'create' && (
                        <Badge variant="outline" className="text-blue-600">
                          <Plus className="h-3 w-3 mr-1" />
                          Nova tag
                        </Badge>
                      )}
                      {mapping.action === 'ignore' && (
                        <Badge variant="outline" className="text-gray-600">
                          <X className="h-3 w-3 mr-1" />
                          Ignorada
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {unmappedTags.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="auto-create-tags"
                      checked={autoCreateTags}
                      onChange={(e) => setAutoCreateTags(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="auto-create-tags" className="text-sm">
                      Criar automaticamente {unmappedTags.length} tags nao mapeadas
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleSkip}>
            <SkipForward className="h-4 w-4 mr-2" />
            Pular Mapeamento
          </Button>
          <Button onClick={handleProceed}>
            <Check className="h-4 w-4 mr-2" />
            Continuar Importacao
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default XLSXCategoryMappingModal;
