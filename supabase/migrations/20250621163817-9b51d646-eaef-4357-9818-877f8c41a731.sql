
-- Criar tabela para configurações de notificação do usuário
CREATE TABLE public.user_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  bill_reminders BOOLEAN DEFAULT true,
  budget_alerts BOOLEAN DEFAULT true,
  goal_achieved BOOLEAN DEFAULT true,
  weekly_report BOOLEAN DEFAULT false,
  monthly_report BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para configurações de segurança do usuário
CREATE TABLE public.user_security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  two_factor_auth BOOLEAN DEFAULT false,
  session_timeout BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para configurações gerais do usuário
CREATE TABLE public.user_general_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  language TEXT DEFAULT 'pt-BR',
  currency TEXT DEFAULT 'BRL',
  date_format TEXT DEFAULT 'dd/mm/yyyy',
  month_start_day TEXT DEFAULT '1',
  theme TEXT DEFAULT 'light',
  categories_expanded BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para dispositivos conectados do usuário
CREATE TABLE public.user_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  browser TEXT,
  ip_address INET,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_notification_settings
CREATE POLICY "Users can view their own notification settings" 
  ON public.user_notification_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification settings" 
  ON public.user_notification_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
  ON public.user_notification_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Políticas RLS para user_security_settings
CREATE POLICY "Users can view their own security settings" 
  ON public.user_security_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own security settings" 
  ON public.user_security_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" 
  ON public.user_security_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Políticas RLS para user_general_settings
CREATE POLICY "Users can view their own general settings" 
  ON public.user_general_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own general settings" 
  ON public.user_general_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own general settings" 
  ON public.user_general_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Políticas RLS para user_devices
CREATE POLICY "Users can view their own devices" 
  ON public.user_devices 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own device records" 
  ON public.user_devices 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device records" 
  ON public.user_devices 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device records" 
  ON public.user_devices 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_notification_settings_updated_at BEFORE UPDATE
    ON public.user_notification_settings FOR EACH ROW EXECUTE PROCEDURE 
    update_updated_at_column();

CREATE TRIGGER update_user_security_settings_updated_at BEFORE UPDATE
    ON public.user_security_settings FOR EACH ROW EXECUTE PROCEDURE 
    update_updated_at_column();

CREATE TRIGGER update_user_general_settings_updated_at BEFORE UPDATE
    ON public.user_general_settings FOR EACH ROW EXECUTE PROCEDURE 
    update_updated_at_column();
