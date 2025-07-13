import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Star, Package, TrendingUp } from 'lucide-react';

interface ControlStatsProps {
  totalProducts: number;
  totalLiveloPoints: number;
  productsInWarranty: number;
  expiredWarranty: number;
}

export const ControlStats = ({ 
  totalProducts, 
  totalLiveloPoints, 
  productsInWarranty, 
  expiredWarranty 
}: ControlStatsProps) => {
  const warrantyPercentage = totalProducts > 0 ? (productsInWarranty / totalProducts) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-finance-card border-finance-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-finance-text-secondary">
            Total de Produtos
          </CardTitle>
          <div className="h-4 w-4 rounded-full bg-finance-secondary/20 flex items-center justify-center">
            <Package className="h-3 w-3 text-finance-secondary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-finance-text-primary">
            {totalProducts}
          </div>
          <p className="text-xs text-finance-text-tertiary">
            produtos cadastrados
          </p>
        </CardContent>
      </Card>

      <Card className="bg-finance-card border-finance-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-finance-text-secondary">
            Pontos Livelo
          </CardTitle>
          <div className="h-4 w-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Star className="h-3 w-3 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-finance-text-primary">
            {totalLiveloPoints.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-finance-text-tertiary">
            pontos acumulados
          </p>
        </CardContent>
      </Card>

      <Card className="bg-finance-card border-finance-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-finance-text-secondary">
            Com Garantia
          </CardTitle>
          <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <Shield className="h-3 w-3 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-finance-text-primary">
            {productsInWarranty}
          </div>
          <p className="text-xs text-finance-text-tertiary">
            {warrantyPercentage.toFixed(0)}% do total
          </p>
        </CardContent>
      </Card>

      <Card className="bg-finance-card border-finance-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-finance-text-secondary">
            Sem Garantia
          </CardTitle>
          <div className="h-4 w-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <TrendingUp className="h-3 w-3 text-red-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-finance-text-primary">
            {expiredWarranty}
          </div>
          <p className="text-xs text-finance-text-tertiary">
            produtos descobertos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};