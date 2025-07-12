
import { useUserSettings } from "@/hooks/useUserSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

const GeneralSettings = () => {
  const { 
    generalSettings, 
    loading, 
    saveGeneralSettings 
  } = useUserSettings();

  const handleSelectChange = (field: keyof typeof generalSettings, value: string) => {
    const updatedSettings = {
      ...generalSettings,
      [field]: value,
    };
    saveGeneralSettings(updatedSettings);
  };

  const handleSwitchChange = (field: keyof typeof generalSettings, checked: boolean) => {
    const updatedSettings = {
      ...generalSettings,
      [field]: checked,
    };
    saveGeneralSettings(updatedSettings);
  };

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Preferências Regionais</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select
                  value={generalSettings.language}
                  onValueChange={(value) => handleSelectChange('language', value)}
                  disabled={loading}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (USA)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select
                  value={generalSettings.currency}
                  onValueChange={(value) => handleSelectChange('currency', value)}
                  disabled={loading}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (R$)</SelectItem>
                    <SelectItem value="USD">Dólar (US$)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">Libra (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Formatação</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Formato de data</Label>
              <RadioGroup 
                value={generalSettings.date_format}
                onValueChange={(value) => handleSelectChange('date_format', value)}
                className="flex flex-col space-y-1"
                disabled={loading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dd/mm/yyyy" id="date-format-1" />
                  <Label htmlFor="date-format-1">DD/MM/AAAA (31/12/2025)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mm/dd/yyyy" id="date-format-2" />
                  <Label htmlFor="date-format-2">MM/DD/AAAA (12/31/2025)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yyyy-mm-dd" id="date-format-3" />
                  <Label htmlFor="date-format-3">AAAA-MM-DD (2025-12-31)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthStartDay">Dia de início do mês</Label>
              <Select
                value={generalSettings.month_start_day}
                onValueChange={(value) => handleSelectChange('month_start_day', value)}
                disabled={loading}
              >
                <SelectTrigger id="monthStartDay">
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (primeiro dia)</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Define o início do ciclo financeiro mensal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Aparência</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tema</Label>
              <RadioGroup 
                value={generalSettings.theme}
                onValueChange={(value) => handleSelectChange('theme', value)}
                className="flex space-x-4"
                disabled={loading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light">Claro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">Escuro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system">Sistema</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="categoriesExpanded" className="flex flex-col">
                <span>Categorias expandidas</span>
                <span className="text-sm text-gray-500">Exibir categorias expandidas por padrão</span>
              </Label>
              <Switch 
                id="categoriesExpanded" 
                checked={generalSettings.categories_expanded}
                onCheckedChange={(checked) => handleSwitchChange('categories_expanded', checked)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
