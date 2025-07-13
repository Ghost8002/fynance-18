
import { useState } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Car, Coins, Home, Laptop, TrendingUp, TrendingDown } from 'lucide-react';
import { AssetForm } from '@/components/assets/AssetForm';
import { AssetList } from '@/components/assets/AssetList';
import { AssetStats } from '@/components/assets/AssetStats';

const Assets = () => {
  const [showForm, setShowForm] = useState(false);

  // Dados mockados para patrimônio
  const mockAssets = [
    {
      id: '1',
      name: 'Casa Principal',
      type: 'imovel',
      category: 'Residencial',
      currentValue: 750000,
      purchasePrice: 650000,
      purchaseDate: '2020-03-15',
      condition: 'Excelente',
      location: 'São Paulo, SP',
      notes: 'Casa própria financiada'
    },
    {
      id: '2',
      name: 'Honda Civic 2022',
      type: 'veiculo',
      category: 'Automóvel',
      currentValue: 120000,
      purchasePrice: 130000,
      purchaseDate: '2022-01-10',
      condition: 'Muito Bom',
      location: 'Garagem',
      notes: 'Quitado'
    },
    {
      id: '3',
      name: 'MacBook Pro M2',
      type: 'eletronico',
      category: 'Computador',
      currentValue: 8500,
      purchasePrice: 12000,
      purchaseDate: '2023-06-20',
      condition: 'Bom',
      location: 'Escritório',
      notes: 'Para trabalho'
    },
    {
      id: '4',
      name: 'Ações Itaú',
      type: 'investimento',
      category: 'Ações',
      currentValue: 25000,
      purchasePrice: 20000,
      purchaseDate: '2023-01-15',
      condition: 'N/A',
      location: 'Corretora',
      notes: '500 ações ITUB4'
    }
  ];

  const totalValue = mockAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalPurchaseValue = mockAssets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
  const totalGainLoss = totalValue - totalPurchaseValue;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-finance-text-primary">Patrimônio</h1>
            <p className="text-finance-text-secondary mt-2">
              Controle e monitore todos os seus bens e investimentos
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-finance-primary hover:bg-finance-primary/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Bem
          </Button>
        </div>

        {/* Stats Cards */}
        <AssetStats
          totalValue={totalValue}
          totalGainLoss={totalGainLoss}
          assetsCount={mockAssets.length}
        />

        {/* Assets by Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-finance-text-secondary">
                  Imóveis
                </CardTitle>
                <Home className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-finance-text-primary">
                R$ {mockAssets.filter(a => a.type === 'imovel').reduce((sum, a) => sum + a.currentValue, 0).toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-finance-text-tertiary">
                {mockAssets.filter(a => a.type === 'imovel').length} item(s)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-finance-text-secondary">
                  Veículos
                </CardTitle>
                <Car className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-finance-text-primary">
                R$ {mockAssets.filter(a => a.type === 'veiculo').reduce((sum, a) => sum + a.currentValue, 0).toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-finance-text-tertiary">
                {mockAssets.filter(a => a.type === 'veiculo').length} item(s)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-finance-text-secondary">
                  Investimentos
                </CardTitle>
                <Coins className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-finance-text-primary">
                R$ {mockAssets.filter(a => a.type === 'investimento').reduce((sum, a) => sum + a.currentValue, 0).toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-finance-text-tertiary">
                {mockAssets.filter(a => a.type === 'investimento').length} item(s)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-finance-text-secondary">
                  Eletrônicos
                </CardTitle>
                <Laptop className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-finance-text-primary">
                R$ {mockAssets.filter(a => a.type === 'eletronico').reduce((sum, a) => sum + a.currentValue, 0).toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-finance-text-tertiary">
                {mockAssets.filter(a => a.type === 'eletronico').length} item(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assets List */}
        <AssetList assets={mockAssets} />

        {/* Asset Form Modal */}
        {showForm && (
          <AssetForm
            onClose={() => setShowForm(false)}
            onSave={(asset) => {
              console.log('Novo bem adicionado:', asset);
              setShowForm(false);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Assets;
