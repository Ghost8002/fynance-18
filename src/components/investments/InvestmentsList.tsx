import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvestmentCard } from './InvestmentCard';
import { InvestmentForm } from './InvestmentForm';
import { InvestmentTransactionForm } from './InvestmentTransactionForm';
import { Investment, InvestmentFormData, InvestmentTransactionFormData, INVESTMENT_TYPE_LABELS } from '@/types/investments';
import { toast } from 'sonner';

interface InvestmentsListProps {
  investments: Investment[];
  loading: boolean;
  onCreateInvestment: (data: InvestmentFormData) => Promise<{ error: string | null }>;
  onUpdateInvestment: (id: string, data: Partial<InvestmentFormData>) => Promise<{ error: string | null }>;
  onDeleteInvestment: (id: string) => Promise<{ error: string | null }>;
  onCreateTransaction: (data: InvestmentTransactionFormData) => Promise<{ error: string | null }>;
}

export function InvestmentsList({
  investments,
  loading,
  onCreateInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onCreateTransaction
}: InvestmentsListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const handleEdit = (investment: Investment) => {
    setSelectedInvestment(investment);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) return;
    
    const { error } = await onDeleteInvestment(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Investimento excluído com sucesso');
    }
  };

  const handleAddTransaction = (investment: Investment) => {
    setSelectedInvestment(investment);
    setTransactionFormOpen(true);
  };

  const handleFormSubmit = async (data: InvestmentFormData) => {
    if (selectedInvestment) {
      const { error } = await onUpdateInvestment(selectedInvestment.id, data);
      if (error) {
        toast.error(error);
        return { error };
      }
      toast.success('Investimento atualizado com sucesso');
    } else {
      const { error } = await onCreateInvestment(data);
      if (error) {
        toast.error(error);
        return { error };
      }
      toast.success('Investimento criado com sucesso');
    }
    setSelectedInvestment(null);
    return { error: null };
  };

  const handleTransactionSubmit = async (data: InvestmentTransactionFormData) => {
    const { error } = await onCreateTransaction(data);
    if (error) {
      toast.error(error);
      return { error };
    }
    toast.success('Movimentação registrada com sucesso');
    return { error: null };
  };

  const filteredInvestments = investments.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.ticker?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || inv.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar investimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(INVESTMENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={() => { setSelectedInvestment(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Investimento
        </Button>
      </div>

      {filteredInvestments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {investments.length === 0 
              ? 'Você ainda não tem investimentos cadastrados.'
              : 'Nenhum investimento encontrado com os filtros aplicados.'}
          </p>
          {investments.length === 0 && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Investimento
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvestments.map(investment => (
            <InvestmentCard
              key={investment.id}
              investment={investment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddTransaction={handleAddTransaction}
            />
          ))}
        </div>
      )}

      <InvestmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        investment={selectedInvestment}
        onSubmit={handleFormSubmit}
      />

      <InvestmentTransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        investment={selectedInvestment}
        onSubmit={handleTransactionSubmit}
      />
    </div>
  );
}
