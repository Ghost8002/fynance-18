
import { useState, useEffect } from 'react';

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  transactionAlerts: boolean;
  budgetAlerts: boolean;
  reminderAlerts: boolean;
}

export interface GeneralSettings {
  language: string;
  currency: string;
  dateFormat: string;
  theme: string;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  biometricAuth: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
}

export const useSettings = () => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    transactionAlerts: true,
    budgetAlerts: true,
    reminderAlerts: true,
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: 'pt-BR',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    theme: 'system',
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    biometricAuth: false,
    sessionTimeout: 30,
    loginNotifications: true,
  });

  const [loading, setLoading] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedNotificationSettings = localStorage.getItem('notificationSettings');
    const savedGeneralSettings = localStorage.getItem('generalSettings');
    const savedSecuritySettings = localStorage.getItem('securitySettings');

    if (savedNotificationSettings) {
      setNotificationSettings(JSON.parse(savedNotificationSettings));
    }
    if (savedGeneralSettings) {
      setGeneralSettings(JSON.parse(savedGeneralSettings));
    }
    if (savedSecuritySettings) {
      setSecuritySettings(JSON.parse(savedSecuritySettings));
    }
  }, []);

  const saveNotificationSettings = async (settings: NotificationSettings) => {
    setLoading(true);
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      setNotificationSettings(settings);
      return { success: true };
    } catch (error) {
      console.error('Error saving notification settings:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const saveGeneralSettings = async (settings: GeneralSettings) => {
    setLoading(true);
    try {
      localStorage.setItem('generalSettings', JSON.stringify(settings));
      setGeneralSettings(settings);
      return { success: true };
    } catch (error) {
      console.error('Error saving general settings:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const saveSecuritySettings = async (settings: SecuritySettings) => {
    setLoading(true);
    try {
      localStorage.setItem('securitySettings', JSON.stringify(settings));
      setSecuritySettings(settings);
      return { success: true };
    } catch (error) {
      console.error('Error saving security settings:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    notificationSettings,
    generalSettings,
    securitySettings,
    loading,
    saveNotificationSettings,
    saveGeneralSettings,
    saveSecuritySettings,
  };
};
