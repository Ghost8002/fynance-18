
-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'investment', 'wallet', 'other')),
  bank TEXT,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  account_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cards table
CREATE TABLE public.cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  last_four_digits TEXT NOT NULL,
  expiry_date TEXT,
  credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
  used_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  closing_day INTEGER NOT NULL DEFAULT 1,
  due_day INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  limit_amount DECIMAL(15,2) NOT NULL,
  spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  deadline DATE,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receivable_payments table
CREATE TABLE public.receivable_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue')),
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for accounts
CREATE POLICY "Users can view their own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for cards
CREATE POLICY "Users can view their own cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cards" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cards" ON public.cards FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for categories
CREATE POLICY "Users can view their own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for budgets
CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for goals
CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for receivable_payments
CREATE POLICY "Users can view their own receivable_payments" ON public.receivable_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own receivable_payments" ON public.receivable_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receivable_payments" ON public.receivable_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receivable_payments" ON public.receivable_payments FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
