
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { History, TrendingUp, TrendingDown, Settings, RefreshCw } from "lucide-react";

interface CardLimitHistoryProps {
  cardId: string;
}

interface LimitHistoryEntry {
  id: string;
  movement_type: string; // Changed from union type to string to match database response
  amount: number;
  previous_used_amount: number;
  new_used_amount: number;
  description: string;
  created_at: string;
}

export const CardLimitHistory = ({ cardId }: CardLimitHistoryProps) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<LimitHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    if (!user?.id || !cardId) return;

    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('card_limit_history')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching card limit history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id, cardId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'charge':
        return <TrendingUp size={16} className="text-red-500" />;
      case 'payment':
        return <TrendingDown size={16} className="text-green-500" />;
      case 'adjustment':
        return <Settings size={16} className="text-blue-500" />;
      default:
        return <History size={16} />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'charge':
        return <Badge variant="destructive">Cobrança</Badge>;
      case 'payment':
        return <Badge variant="default" className="bg-green-600">Pagamento</Badge>;
      case 'adjustment':
        return <Badge variant="secondary">Ajuste</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'charge':
        return 'text-red-600';
      case 'payment':
        return 'text-green-600';
      case 'adjustment':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            Carregando histórico...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History size={20} />
            Histórico de Limite
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchHistory}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma movimentação encontrada</p>
            <p className="text-sm mt-2">As movimentações aparecerão aqui conforme você usar o cartão</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-3">
                  {getMovementIcon(entry.movement_type)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getMovementBadge(entry.movement_type)}
                      <span className={`font-medium ${getMovementColor(entry.movement_type)}`}>
                        {entry.movement_type === 'payment' ? '-' : '+'}{formatCurrency(entry.amount)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-muted-foreground">
                    {formatCurrency(entry.previous_used_amount)} → {formatCurrency(entry.new_used_amount)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Limite usado
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
