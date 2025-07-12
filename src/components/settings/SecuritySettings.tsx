
import { useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useUserDevices } from "@/hooks/useUserDevices";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Shield, Trash2, Smartphone, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SecuritySettings = () => {
  const { toast } = useToast();
  const { securitySettings, loading: settingsLoading, saveSecuritySettings } = useUserSettings();
  const { devices, loading: devicesLoading, removeDevice } = useUserDevices();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleToggle = (setting: keyof typeof securitySettings) => {
    const updatedSettings = {
      ...securitySettings,
      [setting]: !securitySettings[setting],
    };
    saveSecuritySettings(updatedSettings);
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    }
  };

  const formatLastActive = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getDeviceIcon = (deviceType: string) => {
    return deviceType === 'mobile' ? Smartphone : Monitor;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Alteração de Senha</h3>
          
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handlePasswordUpdate(); }}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha atual</Label>
              <div className="relative">
                <Input 
                  id="current-password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Digite sua senha atual"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input 
                  id="new-password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Digite a nova senha"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirme a nova senha</Label>
              <Input 
                id="confirm-password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Confirme sua nova senha"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              />
            </div>
            
            <Button 
              type="submit"
              className="bg-finance-blue hover:bg-blue-700"
            >
              Atualizar senha
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Configurações de Segurança</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="twoFactorAuth" className="flex flex-col">
                <span>Autenticação em duas etapas</span>
                <span className="text-sm text-gray-500">Adiciona uma camada extra de segurança à sua conta</span>
              </Label>
              <Switch 
                id="twoFactorAuth" 
                checked={securitySettings.two_factor_auth}
                onCheckedChange={() => handleToggle("two_factor_auth")}
                disabled={settingsLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sessionTimeout" className="flex flex-col">
                <span>Timeout de sessão</span>
                <span className="text-sm text-gray-500">Encerrar sessão após período de inatividade</span>
              </Label>
              <Switch 
                id="sessionTimeout" 
                checked={securitySettings.session_timeout}
                onCheckedChange={() => handleToggle("session_timeout")}
                disabled={settingsLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="securityAlerts" className="flex flex-col">
                <span>Alertas de segurança</span>
                <span className="text-sm text-gray-500">Receba notificações sobre atividades suspeitas</span>
              </Label>
              <Switch 
                id="securityAlerts" 
                checked={securitySettings.security_alerts}
                onCheckedChange={() => handleToggle("security_alerts")}
                disabled={settingsLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-amber-100 p-2 rounded-full">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Dispositivos conectados</h3>
              <p className="text-sm text-gray-500">Gerencie os dispositivos que têm acesso à sua conta</p>
            </div>
          </div>
          
          {devicesLoading ? (
            <p className="text-gray-500">Carregando dispositivos...</p>
          ) : devices.length === 0 ? (
            <p className="text-gray-500">Nenhum dispositivo conectado encontrado.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {devices.map((device) => {
                const IconComponent = getDeviceIcon(device.device_type);
                return (
                  <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{device.device_name}</p>
                        <p className="text-sm text-gray-500">
                          {device.browser} • Último acesso: {formatLastActive(device.last_active)}
                        </p>
                        {device.is_current && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Dispositivo atual
                          </span>
                        )}
                      </div>
                    </div>
                    {!device.is_current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeDevice(device.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
