
import { useUserSettings } from "@/hooks/useUserSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const NotificationSettings = () => {
  const { 
    notificationSettings, 
    loading, 
    saveNotificationSettings 
  } = useUserSettings();

  const handleToggle = (setting: keyof typeof notificationSettings) => {
    const updatedSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    };
    saveNotificationSettings(updatedSettings);
  };

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Canais de Notificação</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications" className="flex flex-col">
                <span>Notificações por e-mail</span>
                <span className="text-sm text-muted-foreground">Receba alertas no seu e-mail</span>
              </Label>
              <Switch 
                id="emailNotifications" 
                checked={notificationSettings.email_notifications}
                onCheckedChange={() => handleToggle("email_notifications")}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotifications" className="flex flex-col">
                <span>Notificações push</span>
                <span className="text-sm text-muted-foreground">Receba alertas no seu celular</span>
              </Label>
              <Switch 
                id="pushNotifications" 
                checked={notificationSettings.push_notifications}
                onCheckedChange={() => handleToggle("push_notifications")}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Tipos de Alerta</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="billReminders" className="flex flex-col">
                <span>Lembretes de contas</span>
                <span className="text-sm text-muted-foreground">Aviso antes do vencimento de contas</span>
              </Label>
              <Switch 
                id="billReminders" 
                checked={notificationSettings.bill_reminders}
                onCheckedChange={() => handleToggle("bill_reminders")}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="budgetAlerts" className="flex flex-col">
                <span>Alertas de orçamento</span>
                <span className="text-sm text-muted-foreground">Quando um limite de categoria for atingido</span>
              </Label>
              <Switch 
                id="budgetAlerts" 
                checked={notificationSettings.budget_alerts}
                onCheckedChange={() => handleToggle("budget_alerts")}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="goalAchieved" className="flex flex-col">
                <span>Metas atingidas</span>
                <span className="text-sm text-muted-foreground">Quando você atingir uma meta financeira</span>
              </Label>
              <Switch 
                id="goalAchieved" 
                checked={notificationSettings.goal_achieved}
                onCheckedChange={() => handleToggle("goal_achieved")}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Relatórios Periódicos</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="weeklyReport" className="flex flex-col">
                <span>Relatório semanal</span>
                <span className="text-sm text-muted-foreground">Receba um resumo das suas finanças a cada semana</span>
              </Label>
              <Switch 
                id="weeklyReport" 
                checked={notificationSettings.weekly_report}
                onCheckedChange={() => handleToggle("weekly_report")}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="monthlyReport" className="flex flex-col">
                <span>Relatório mensal</span>
                <span className="text-sm text-muted-foreground">Receba um resumo das suas finanças a cada mês</span>
              </Label>
              <Switch 
                id="monthlyReport" 
                checked={notificationSettings.monthly_report}
                onCheckedChange={() => handleToggle("monthly_report")}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
