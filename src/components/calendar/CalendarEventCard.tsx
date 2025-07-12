
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { useCalendarActions } from "@/hooks/useCalendarActions";
import { Clock, CreditCard, Building, Tag, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface CalendarEventCardProps {
  event: CalendarEvent;
}

const CalendarEventCard = ({ event }: CalendarEventCardProps) => {
  const { markReceivableAsReceived, markDebtAsPaid } = useCalendarActions();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(value));
  };

  const getStatusLabel = (status?: string) => {
    const statusLabels = {
      pending: 'Pendente',
      received: 'Recebido',
      paid: 'Pago',
      overdue: 'Vencido'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'received':
      case 'paid':
        return 'default';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'received':
      case 'paid':
        return <CheckCircle className="h-3 w-3" />;
      case 'overdue':
        return <XCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string, amount?: number) => {
    switch (type) {
      case 'transaction':
        return amount && amount > 0 ? 'text-green-600' : 'text-red-600';
      case 'receivable':
        return 'text-blue-600';
      case 'debt':
        return 'text-orange-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleActionClick = () => {
    if (event.type === 'receivable' && event.status === 'pending') {
      markReceivableAsReceived(event);
    } else if (event.type === 'debt' && event.status === 'pending') {
      markDebtAsPaid(event);
    }
  };

  const showActionButton = 
    (event.type === 'receivable' && event.status === 'pending') ||
    (event.type === 'debt' && event.status === 'pending');

  return (
    <Card className={`transition-all hover:shadow-md ${
      event.status === 'overdue' ? 'border-red-200 bg-red-50/50' : ''
    }`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2 flex-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: event.color }}
              />
              <span className="font-medium text-sm truncate">{event.title}</span>
              {event.status && (
                <Badge variant={getStatusVariant(event.status)} className="text-xs">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(event.status)}
                    {getStatusLabel(event.status)}
                  </div>
                </Badge>
              )}
            </div>
            <div className="text-right">
              <span className={`font-bold text-sm ${getTypeColor(event.type, event.amount)}`}>
                {event.type === 'transaction' && event.amount > 0 ? '+' : ''}
                {formatCurrency(event.amount)}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {event.description}
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-2 text-xs">
            {event.category && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-3 w-3" />
                <span>Categoria: {event.category}</span>
              </div>
            )}
            {event.account && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-3 w-3" />
                <span>Conta: {event.account}</span>
              </div>
            )}
            {event.type !== 'transaction' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {event.type === 'receivable' ? 'Vencimento' : 'Vencimento'}: {' '}
                  {event.date.toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {showActionButton && (
            <div className="pt-3 border-t">
              <Button
                size="sm"
                variant={event.status === 'overdue' ? 'destructive' : 'outline'}
                onClick={handleActionClick}
                className="w-full transition-colors"
              >
                {event.type === 'receivable' ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Marcar como Recebido
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Marcar como Pago
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarEventCard;
