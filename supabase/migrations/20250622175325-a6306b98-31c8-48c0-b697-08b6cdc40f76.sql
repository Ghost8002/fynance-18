
-- Update the handle_new_user function to create the correct default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert user profile
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Insert default categories for expenses
  INSERT INTO public.categories (user_id, name, type, color) VALUES
  (NEW.id, 'Moradia', 'expense', '#8B5CF6'),
  (NEW.id, 'Alimentação', 'expense', '#EF4444'),
  (NEW.id, 'Transporte', 'expense', '#F97316'),
  (NEW.id, 'Saúde', 'expense', '#84CC16'),
  (NEW.id, 'Educação', 'expense', '#6366F1'),
  (NEW.id, 'Lazer', 'expense', '#06B6D4'),
  (NEW.id, 'Outros', 'expense', '#9CA3AF');
  
  -- Insert default categories for income
  INSERT INTO public.categories (user_id, name, type, color) VALUES
  (NEW.id, 'Salário', 'income', '#10B981'),
  (NEW.id, 'Freelancer', 'income', '#059669'),
  (NEW.id, 'Investimentos', 'income', '#047857'),
  (NEW.id, 'Pix', 'income', '#34D399'),
  (NEW.id, 'Bolsa', 'income', '#065F46'),
  (NEW.id, 'Outros', 'income', '#6B7280');
  
  RETURN NEW;
END;
$function$
