
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';

// Mock user settings since we don't have the settings tables yet
interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  bill_reminders: boolean;
  budget_alerts: boolean;
  goal_achieved: boolean;
  weekly_report: boolean;
  monthly_report: boolean;
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
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);

  // Default settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    bill_reminders: true,
    budget_alerts: true,
    goal_achieved: true,
    weekly_report: false,
    monthly_report: true,
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: 'pt-BR',
    currency: 'BRL',
    date_format: 'dd/mm/yyyy',
    month_start_day: '1',
    theme: 'light',
    categories_expanded: true,
  });

  const saveNotificationSettings = async (settings: NotificationSettings) => {
    setLoading(true);
    // For now, just update local state
    setNotificationSettings(settings);
    setLoading(false);
  };

  const saveGeneralSettings = async (settings: GeneralSettings) => {
    setLoading(true);
    // For now, just update local state
    setGeneralSettings(settings);
    setLoading(false);
  };

  return {
    notificationSettings,
    generalSettings,
    loading,
    saveNotificationSettings,
    saveGeneralSettings,
  };
};
