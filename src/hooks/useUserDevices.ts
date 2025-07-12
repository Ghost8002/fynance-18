
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserDevice {
  id: string;
  device_name: string;
  device_type: string;
  browser?: string;
  ip_address?: unknown;
  last_active: string;
  is_current: boolean;
  created_at: string;
}

export const useUserDevices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDevices = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Erro ao carregar dispositivos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dispositivos conectados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCurrentDevice = async () => {
    if (!user?.id) return;

    try {
      const deviceInfo = {
        user_id: user.id,
        device_name: navigator.platform || 'Dispositivo desconhecido',
        device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browser: navigator.userAgent.split(' ').pop() || 'Navegador desconhecido',
        is_current: true,
      };

      // Marcar outros dispositivos como não atuais
      await supabase
        .from('user_devices')
        .update({ is_current: false })
        .eq('user_id', user.id);

      // Inserir dispositivo atual
      const { error } = await supabase
        .from('user_devices')
        .insert(deviceInfo);

      if (error) throw error;
      
      await loadDevices();
    } catch (error) {
      console.error('Erro ao registrar dispositivo atual:', error);
    }
  };

  const removeDevice = async (deviceId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      setDevices(devices.filter(device => device.id !== deviceId));
      toast({
        title: "Dispositivo removido",
        description: "O dispositivo foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover dispositivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o dispositivo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadDevices();
      addCurrentDevice();
    }
  }, [user?.id]);

  return {
    devices,
    loading,
    removeDevice,
    refreshDevices: loadDevices,
  };
};
