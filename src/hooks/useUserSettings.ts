
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  bill_reminders: boolean;
  budget_alerts: boolean;
  goal_achieved: boolean;
  weekly_report: boolean;
  monthly_report: boolean;
}

interface SecuritySettings {
  two_factor_auth: boolean;
  session_timeout: boolean;
  security_alerts: boolean;
}

interface GeneralSettings {
  language: string;
  currency: string;
  date_format: string;
  month_start_day: string;
  theme: string;
  categories_expanded: boolean;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    bill_reminders: true,
    budget_alerts: true,
    goal_achieved: true,
    weekly_report: false,
    monthly_report: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_auth: false,
    session_timeout: true,
    security_alerts: true,
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: 'pt-BR',
    currency: 'BRL',
    date_format: 'dd/mm/yyyy',
    month_start_day: '1',
    theme: 'light',
    categories_expanded: true,
  });

  // Carregar configurações do usuário
  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Carregar configurações de notificação
      const { data: notifData } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (notifData) {
        setNotificationSettings({
          email_notifications: notifData.email_notifications,
          push_notifications: notifData.push_notifications,
          bill_reminders: notifData.bill_reminders,
          budget_alerts: notifData.budget_alerts,
          goal_achieved: notifData.goal_achieved,
          weekly_report: notifData.weekly_report,
          monthly_report: notifData.monthly_report,
        });
      }

      // Carregar configurações de segurança
      const { data: secData } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (secData) {
        setSecuritySettings({
          two_factor_auth: secData.two_factor_auth,
          session_timeout: secData.session_timeout,
          security_alerts: secData.security_alerts,
        });
      }

      // Carregar configurações gerais
      const { data: genData } = await supabase
        .from('user_general_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (genData) {
        setGeneralSettings({
          language: genData.language,
          currency: genData.currency,
          date_format: genData.date_format,
          month_start_day: genData.month_start_day,
          theme: genData.theme,
          categories_expanded: genData.categories_expanded,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações de notificação
  const saveNotificationSettings = async (settings: NotificationSettings) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) throw error;

      setNotificationSettings(settings);
      toast({
        title: "Configurações salvas",
        description: "Suas preferências de notificação foram atualizadas.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações de segurança
  const saveSecuritySettings = async (settings: SecuritySettings) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) throw error;

      setSecuritySettings(settings);
      toast({
        title: "Configurações salvas",
        description: "Suas configurações de segurança foram atualizadas.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de segurança:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações gerais
  const saveGeneralSettings = async (settings: GeneralSettings) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_general_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) throw error;

      setGeneralSettings(settings);
      toast({
        title: "Configurações salvas",
        description: "Suas configurações gerais foram atualizadas.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações gerais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  return {
    notificationSettings,
    securitySettings,
    generalSettings,
    loading,
    saveNotificationSettings,
    saveSecuritySettings,
    saveGeneralSettings,
  };
};
