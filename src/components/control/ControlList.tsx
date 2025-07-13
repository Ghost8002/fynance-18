import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Star, Edit, Trash2, Shield, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  warrantyEnd: string;
  liveloPoints: number;
  status: string;
  description: string;
}

interface ControlListProps {
  products: Product[];
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const getStatusBadge = (status: string) => {
  if (status === 'Dentro da garantia') {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <Shield className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="bg-red-100 text-red-800">
      <AlertTriangle className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  );
};

const isWarrantyExpiringSoon = (warrantyEnd: string) => {
  const endDate = new Date(warrantyEnd);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  return endDate <= thirtyDaysFromNow && endDate >= today;
};

export const ControlList = ({ products }: ControlListProps) => {
  return (
    <Card className="bg-finance-card border-finance-border">
      <CardHeader>
        <CardTitle className="text-finance-text-primary">Produtos Cadastrados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => {
            const expiringSoon = isWarrantyExpiringSoon(product.warrantyEnd);
            
            return (
              <div 
                key={product.id} 
                className={`p-4 rounded-lg border transition-colors ${
                  expiringSoon 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : 'border-finance-border bg-finance-background'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-finance-text-primary">
                        {product.name}
                      </h3>
                      {expiringSoon && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                          Vence em breve
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-finance-text-secondary mb-2">
                      {product.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-finance-text-tertiary">Categoria:</span>
                        <p className="font-medium text-finance-text-primary">{product.category}</p>
                      </div>
                      
                      <div>
                        <span className="text-finance-text-tertiary">Compra:</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-finance-text-tertiary" />
                          <p className="font-medium text-finance-text-primary">
                            {formatDate(product.purchaseDate)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-finance-text-tertiary">Garantia até:</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-finance-text-tertiary" />
                          <p className="font-medium text-finance-text-primary">
                            {formatDate(product.warrantyEnd)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-finance-text-tertiary">Pontos Livelo:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <p className="font-medium text-finance-text-primary">
                            {product.liveloPoints.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      {getStatusBadge(product.status)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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