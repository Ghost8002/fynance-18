
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Mock interface for user devices since table doesn't exist yet
interface UserDevice {
  id: string;
  device_name: string;
  device_type: 'mobile' | 'desktop';
  browser: string;
  last_active: string;
  is_current: boolean;
}

export const useUserDevices = () => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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
        description: "Erro ao carregar dispositivos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const registerCurrentDevice = async () => {
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
        description: "O dispositivo foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover dispositivo:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover dispositivo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDevices();
      registerCurrentDevice();
    }
  }, [user]);

  return {
    devices,
    loading,
    removeDevice,
    refreshDevices: loadDevices,
  };
};
