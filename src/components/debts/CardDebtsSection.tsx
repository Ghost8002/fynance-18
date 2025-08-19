import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, RefreshCw, AlertTriangle, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

interface CardDebtsSectionProps {
  onDebtCreated?: () => void;
}

export const CardDebtsSection: React.FC<CardDebtsSectionProps> = ({ onDebtCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: cards } = useSupabaseData('cards', user?.id);
  const [syncing, setSyncing] = useState(false);

  // Função temporária para sincronizar
  const handleSyncAllCardDebts = async () => {
    setSyncing(true);
    try {
      toast({
        title: "Sincronização",
        description: "Funcionalidade em desenvolvimento",
      });
    } catch (error) {
      console.error('Erro ao sincronizar dívidas:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Dívidas de Cartão
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAllCardDebts}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sincronizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Integração com cartões em desenvolvimento</p>
          <p className="text-sm">As faturas e parcelamentos aparecerão aqui quando a integração estiver completa</p>
        </div>
      </CardContent>
    </Card>
  );
};
