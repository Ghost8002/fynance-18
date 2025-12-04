import React, { Suspense, lazy, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileSpreadsheet, FileText, Info } from 'lucide-react';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { devWarn } from '@/utils/logger';

// Componentes lazy
const SimpleImportComponent = lazy(() => import('./SimpleImportComponent'));
const SimpleOFXImportComponent = lazy(() => import('./SimpleOFXImportComponent'));

interface LazyImportComponentProps {
  defaultTab?: 'xlsx' | 'ofx';
}

const LazyImportComponent: React.FC<LazyImportComponentProps> = ({ defaultTab = 'xlsx' }) => {
  const [activeTab, setActiveTab] = useState<'xlsx' | 'ofx'>(defaultTab);
  const [isPreloaded, setIsPreloaded] = useState(false);

  // Lazy load do componente ativo
  const { data: activeComponent, isLoading, load, ref } = useLazyLoad(
    async () => {
      // Simular carregamento do componente
      await new Promise(resolve => setTimeout(resolve, 100));
      return activeTab;
    },
    {
      threshold: 0.1,
      rootMargin: '100px',
      delay: 50
    }
  );

  // Pré-carregar componentes quando próximo
  const preloadComponents = async () => {
    if (!isPreloaded) {
      try {
        // Pré-carregar ambos os componentes
        await Promise.all([
          import('./SimpleImportComponent'),
          import('./SimpleOFXImportComponent')
        ]);
        setIsPreloaded(true);
      } catch (error) {
        devWarn('Erro ao pré-carregar componentes:', error);
      }
    }
  };

  const handleTabChange = (tab: 'xlsx' | 'ofx') => {
    setActiveTab(tab);
    load(); // Recarregar componente
  };

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6 text-blue-600" />
            Importação com Lazy Loading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações sobre lazy loading */}
          <Alert className="bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-foreground">
              <strong>Lazy Loading Ativo:</strong> Os componentes são carregados apenas quando necessários, 
              melhorando a performance inicial da aplicação.
            </AlertDescription>
          </Alert>

          {/* Tabs de navegação */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'xlsx' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('xlsx')}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              XLSX
            </Button>
            <Button
              variant={activeTab === 'ofx' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('ofx')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              OFX
            </Button>
          </div>

          {/* Status de carregamento */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-muted-foreground">Carregando componente...</span>
              </div>
            </div>
          )}

          {/* Componente ativo com Suspense */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-muted-foreground">Carregando...</span>
                </div>
              </div>
            }
          >
            {activeTab === 'xlsx' ? (
              <SimpleImportComponent />
            ) : (
              <SimpleOFXImportComponent />
            )}
          </Suspense>

          {/* Botão de pré-carregamento */}
          {!isPreloaded && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={preloadComponents}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Pré-carregar Todos os Componentes
              </Button>
            </div>
          )}

          {/* Status de pré-carregamento */}
          {isPreloaded && (
            <Alert className="bg-green-500/5 dark:bg-green-500/10 border-green-500/20">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-foreground">
                <strong>Componentes Pré-carregados:</strong> Todos os componentes foram carregados 
                para uma experiência mais fluida.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LazyImportComponent;
