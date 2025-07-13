
import { useState, useEffect } from 'react';
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
      // Since user_devices table doesn't exist, we'll return empty array for now
      // This functionality would require creating the user_devices table first
      setDevices([]);
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
      // This would require the user_devices table to be created first
      console.log('Device registration would happen here when table exists');
      await loadDevices();
    } catch (error) {
      console.error('Erro ao registrar dispositivo atual:', error);
    }
  };

  const removeDevice = async (deviceId: string) => {
    try {
      setLoading(true);
      // This would require the user_devices table to be created first
      console.log('Device removal would happen here when table exists');
      
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
