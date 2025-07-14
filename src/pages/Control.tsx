import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, Star, Calendar, AlertTriangle, Clock, CheckCircle, Import } from 'lucide-react';
import { ControlForm } from '@/components/control/ControlForm';
import { ControlList } from '@/components/control/ControlList';
import { ControlStats } from '@/components/control/ControlStats';
import { TransactionImportModal } from '@/components/control/TransactionImportModal';
import AppLayout from '@/components/shared/AppLayout';

const Control = () => {
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedTransactions, setImportedTransactions] = useState<any[]>([]);

  // Dados mockados para controle de produtos
  const mockProducts = [
    {
      id: '1',
      name: 'iPhone 14 Pro',
      category: 'Eletrônicos',
      purchaseDate: '2024-01-15',
      warrantyEnd: '2025-01-15',
      liveloPoints: 1200,
      status: 'Dentro da garantia',
      description: 'Smartphone Apple',
    },
    {
      id: '2',
      name: 'Samsung TV 55"',
      category: 'Eletrônicos',
      purchaseDate: '2023-06-10',
      warrantyEnd: '2024-06-10',
      liveloPoints: 800,
      status: 'Garantia vencida',
      description: 'Smart TV 4K',
    },
    {
      id: '3',
      name: 'Notebook Dell',
      category: 'Eletrônicos',
      purchaseDate: '2024-03-20',
      warrantyEnd: '2025-03-20',
      liveloPoints: 1500,
      status: 'Dentro da garantia',
      description: 'Notebook para trabalho',
    },
    {
      id: '4',
      name: 'Air Fryer Philips',
      category: 'Eletrodomésticos',
      purchaseDate: '2024-05-01',
      warrantyEnd: '2025-05-01',
      liveloPoints: 300,
      status: 'Dentro da garantia',
      description: 'Fritadeira elétrica',
    },
    {
      id: '5',
      name: 'Geladeira Brastemp',
      category: 'Eletrodomésticos',
      purchaseDate: '2022-12-15',
      warrantyEnd: '2023-12-15',
      liveloPoints: 2000,
      status: 'Garantia vencida',
      description: 'Geladeira duplex',
    }
  ];

  const handleSaveProduct = (product: any) => {
    console.log('Produto salvo:', product);
    setShowForm(false);
  };

  const handleImportTransactions = (transactions: any[]) => {
    console.log('Transações importadas:', transactions);
    setImportedTransactions(transactions);
    setShowForm(true); // Abre o formulário para configurar os produtos importados
  };

  const totalLiveloPoints = mockProducts.reduce((sum, product) => sum + product.liveloPoints, 0);
  const productsInWarranty = mockProducts.filter(p => p.status === 'Dentro da garantia').length;
  const expiredWarranty = mockProducts.filter(p => p.status === 'Garantia vencida').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-finance-text-primary">Controle de Produtos</h1>
            <p className="text-finance-text-secondary mt-1">
              Gerencie suas garantias e pontos Livelo
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowImportModal(true)}
              variant="outline"
              className="border-finance-primary text-finance-primary hover:bg-finance-primary hover:text-white"
            >
              <Import className="mr-2 h-4 w-4" />
              Importar Produto
            </Button>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-finance-primary hover:bg-finance-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        {/* Transações Importadas */}
        {importedTransactions.length > 0 && (
          <Card className="bg-finance-card border-finance-border border-l-4 border-l-finance-primary">
            <CardHeader>
              <CardTitle className="text-finance-text-primary flex items-center gap-2">
                <Import className="h-5 w-5" />
                Transações Importadas ({importedTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-finance-text-secondary mb-4">
                Configure os pontos Livelo e a garantia para os produtos importados das transações selecionadas.
              </p>
              <div className="space-y-2">
                {importedTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-finance-background-secondary rounded-lg">
                    <div>
                      <span className="font-medium text-finance-text-primary">{transaction.description}</span>
                      <span className="text-sm text-finance-text-secondary ml-2">
                        R$ {Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Aguardando configuração
                    </Badge>
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => setShowForm(true)}
                className="mt-4 bg-finance-primary hover:bg-finance-primary/90"
              >
                Configurar Produtos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <ControlStats
          totalProducts={mockProducts.length}
          totalLiveloPoints={totalLiveloPoints}
          productsInWarranty={productsInWarranty}
          expiredWarranty={expiredWarranty}
        />

        {/* Produtos por Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-finance-card border-finance-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-finance-text-secondary">
                Garantia Válida
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-finance-text-primary">
                {productsInWarranty}
              </div>
              <p className="text-xs text-finance-text-tertiary">
                produtos protegidos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-finance-card border-finance-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-finance-text-secondary">
                Garantia Vencida
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-finance-text-primary">
                {expiredWarranty}
              </div>
              <p className="text-xs text-finance-text-tertiary">
                produtos sem garantia
              </p>
            </CardContent>
          </Card>

          <Card className="bg-finance-card border-finance-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-finance-text-secondary">
                Vencendo em 30 dias
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-finance-text-primary">
                1
              </div>
              <p className="text-xs text-finance-text-tertiary">
                necessita atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <ControlList products={mockProducts} />

        {/* Form Modal */}
        {showForm && (
          <ControlForm
            onClose={() => {
              setShowForm(false);
              setImportedTransactions([]); // Limpa as transações importadas ao fechar
            }}
            onSave={handleSaveProduct}
            importedTransactions={importedTransactions}
          />
        )}

        {/* Import Modal */}
        <TransactionImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportTransactions}
        />
      </div>
    </AppLayout>
  );
};

export default Control;
