-- Create investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('renda_fixa', 'renda_variavel', 'cripto', 'fundo', 'previdencia', 'outros')),
  ticker TEXT,
  institution TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  average_price NUMERIC NOT NULL DEFAULT 0,
  current_price NUMERIC NOT NULL DEFAULT 0,
  purchase_date DATE,
  maturity_date DATE,
  interest_rate NUMERIC,
  index_type TEXT CHECK (index_type IN ('CDI', 'IPCA', 'SELIC', 'PREFIXADO', 'IGPM', NULL)),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investment_transactions table
CREATE TABLE public.investment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('aporte', 'resgate', 'dividendo', 'jcp', 'bonificacao', 'rendimento')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on investments
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments FORCE ROW LEVEL SECURITY;

-- RLS policies for investments
CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
  ON public.investments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments"
  ON public.investments FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on investment_transactions
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions FORCE ROW LEVEL SECURITY;

-- RLS policies for investment_transactions
CREATE POLICY "Users can view their own investment transactions"
  ON public.investment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment transactions"
  ON public.investment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment transactions"
  ON public.investment_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment transactions"
  ON public.investment_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on investments
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for investments
ALTER PUBLICATION supabase_realtime ADD TABLE public.investments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_transactions;