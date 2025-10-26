-- Create subcategories table
CREATE TABLE public.subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#9CA3AF',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add subcategory_id column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_subcategories_user_id ON public.subcategories(user_id);
CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX idx_transactions_subcategory_id ON public.transactions(subcategory_id);

-- Enable Row Level Security on subcategories table
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subcategories
CREATE POLICY "Users can view own subcategories" ON public.subcategories
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert own subcategories" ON public.subcategories
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update own subcategories" ON public.subcategories
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete own subcategories" ON public.subcategories
    FOR DELETE USING (auth.uid() = user_id);

-- Create function and trigger for updated_at on subcategories
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for subcategories
CREATE TRIGGER handle_updated_at_subcategories
    BEFORE UPDATE ON public.subcategories
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();