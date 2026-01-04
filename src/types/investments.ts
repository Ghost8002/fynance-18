export type InvestmentType = 'renda_fixa' | 'renda_variavel' | 'cripto' | 'fundo' | 'previdencia' | 'outros';
export type IndexType = 'CDI' | 'IPCA' | 'SELIC' | 'PREFIXADO' | 'IGPM' | null;
export type InvestmentTransactionType = 'aporte' | 'resgate' | 'dividendo' | 'jcp' | 'bonificacao' | 'rendimento';

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: InvestmentType;
  ticker: string | null;
  institution: string | null;
  quantity: number;
  average_price: number;
  current_price: number;
  purchase_date: string | null;
  maturity_date: string | null;
  interest_rate: number | null;
  index_type: IndexType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  user_id: string;
  type: InvestmentTransactionType;
  quantity: number;
  price: number;
  total_amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface InvestmentFormData {
  name: string;
  type: InvestmentType;
  ticker?: string;
  institution?: string;
  quantity: number;
  average_price: number;
  current_price: number;
  purchase_date?: string;
  maturity_date?: string;
  interest_rate?: number;
  index_type?: IndexType;
  notes?: string;
}

export interface InvestmentTransactionFormData {
  investment_id: string;
  type: InvestmentTransactionType;
  quantity: number;
  price: number;
  total_amount: number;
  date: string;
  notes?: string;
}

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  renda_fixa: 'Renda Fixa',
  renda_variavel: 'Renda Variável',
  cripto: 'Criptomoedas',
  fundo: 'Fundos',
  previdencia: 'Previdência',
  outros: 'Outros'
};

export const INVESTMENT_TYPE_COLORS: Record<InvestmentType, string> = {
  renda_fixa: '#3B82F6',
  renda_variavel: '#10B981',
  cripto: '#F59E0B',
  fundo: '#8B5CF6',
  previdencia: '#EC4899',
  outros: '#6B7280'
};

export const TRANSACTION_TYPE_LABELS: Record<InvestmentTransactionType, string> = {
  aporte: 'Aporte',
  resgate: 'Resgate',
  dividendo: 'Dividendo',
  jcp: 'JCP',
  bonificacao: 'Bonificação',
  rendimento: 'Rendimento'
};

export const INDEX_TYPE_LABELS: Record<string, string> = {
  CDI: 'CDI',
  IPCA: 'IPCA+',
  SELIC: 'Selic',
  PREFIXADO: 'Prefixado',
  IGPM: 'IGPM+'
};
