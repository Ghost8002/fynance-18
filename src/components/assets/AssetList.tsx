
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, Car, Laptop, Coins, Edit, Trash2, MapPin, Calendar } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: string;
  category: string;
  currentValue: number;
  purchasePrice: number;
  purchaseDate: string;
  condition: string;
  location: string;
  notes: string;
}

interface AssetListProps {
  assets: Asset[];
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'imovel':
      return Home;
    case 'veiculo':
      return Car;
    case 'eletronico':
      return Laptop;
    case 'investimento':
      return Coins;
    default:
      return Home;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'imovel':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'veiculo':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'eletronico':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'investimento':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'imovel':
      return 'Imóvel';
    case 'veiculo':
      return 'Veículo';
    case 'eletronico':
      return 'Eletrônico';
    case 'investimento':
      return 'Investimento';
    default:
      return type;
  }
};

export const AssetList = ({ assets }: AssetListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-finance-text-primary">Lista de Bens</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assets.map((asset) => {
            const Icon = getAssetIcon(asset.type);
            const gainLoss = asset.currentValue - asset.purchasePrice;
            const isPositive = gainLoss >= 0;
            
            return (
              <div
                key={asset.id}
                className="flex items-center justify-between p-4 rounded-lg border border-finance-primary/10 hover:border-finance-primary/30 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-lg ${getTypeColor(asset.type).replace('text-', 'bg-').replace('800', '500/20')}`}>
                      <Icon className="h-6 w-6 text-finance-text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-finance-text-primary truncate">
                        {asset.name}
                      </h3>
                      <Badge className={getTypeColor(asset.type)}>
                        {getTypeName(asset.type)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-finance-text-secondary">
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {asset.location}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(asset.purchaseDate).toLocaleDateString('pt-BR')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {asset.condition}
                      </Badge>
                    </div>
                    
                    {asset.notes && (
                      <p className="text-xs text-finance-text-tertiary mt-1 truncate">
                        {asset.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-bold text-finance-text-primary">
                      R$ {asset.currentValue.toLocaleString('pt-BR')}
                    </div>
                    <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}R$ {gainLoss.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
