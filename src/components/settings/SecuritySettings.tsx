
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings, SecuritySettings as SecuritySettingsType } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";

export default function SecuritySettings() {
  const { securitySettings, saveSecuritySettings } = useSettings();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SecuritySettingsType>(securitySettings);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await saveSecuritySettings(settings);

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Configurações de segurança salvas com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
        <CardDescription>
          Gerencie suas configurações de segurança e autenticação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação de dois fatores</Label>
              <p className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança à sua conta
              </p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, twoFactorAuth: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação biométrica</Label>
              <p className="text-sm text-muted-foreground">
                Use impressão digital ou reconhecimento facial
              </p>
            </div>
            <Switch
              checked={settings.biometricAuth}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, biometricAuth: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Tempo limite da sessão (minutos)</Label>
            <Select
              value={settings.sessionTimeout.toString()}
              onValueChange={(value) =>
                setSettings(prev => ({ ...prev, sessionTimeout: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="240">4 horas</SelectItem>
                <SelectItem value="480">8 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações de login</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações quando alguém fizer login na sua conta
              </p>
            </div>
            <Switch
              checked={settings.loginNotifications}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, loginNotifications: checked }))
              }
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
