import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, CreditCard, Wallet } from "lucide-react";
import BankSelector from "./BankSelector";
import BankLogo from "./BankLogo";
import { BankInfo, getAllActiveBanks } from "@/utils/banks/bankDatabase";

const BankSelectorDemo = () => {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  
  const allBanks = getAllActiveBanks();
  const selectedBank = selectedBankId ? allBanks.find(bank => bank.id === selectedBankId) : null;

  const getBankTypeColor = (type: BankInfo['type']) => {
    switch (type) {
      case 'digital': return 'bg-blue-100 text-blue-800';
      case 'traditional': return 'bg-green-100 text-green-800';
      case 'investment': return 'bg-purple-100 text-purple-800';
      case 'fintech': return 'bg-orange-100 text-orange-800';
      case 'credit_union': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBankTypeLabel = (type: BankInfo['type']) => {
    switch (type) {
      case 'digital': return 'Digital';
      case 'traditional': return 'Tradicional';
      case 'investment': return 'Investimento';
      case 'fintech': return 'Fintech';
      case 'credit_union': return 'Cooperativa';
      default: return 'Outro';
    }
  };

  if (!showDemo) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Seletor de Bancos
          </CardTitle>
          <CardDescription>
            Demonstração da funcionalidade de seleção de bancos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta funcionalidade permite:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Buscar bancos por nome</li>
              <li>• Visualizar logos dos bancos</li>
              <li>• Criar bancos customizados</li>
              <li>• Integração com Cartões e Contas</li>
            </ul>
            <Button 
              onClick={() => setShowDemo(true)}
              className="w-full"
            >
              Ver Demonstração
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Demonstração do Seletor de Bancos
          </CardTitle>
          <CardDescription>
            Teste a funcionalidade de seleção e criação de bancos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BankSelector
            selectedBankId={selectedBankId || undefined}
            onBankChange={setSelectedBankId}
            placeholder="Selecione um banco..."
          />
          
          {selectedBank && (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BankLogo 
                      logoPath={selectedBank.logoPath} 
                      bankName={selectedBank.name}
                      size="md"
                    />
                    {selectedBank.shortName}
                  </CardTitle>
                  <Badge className={getBankTypeColor(selectedBank.type)}>
                    {getBankTypeLabel(selectedBank.type)}
                  </Badge>
                </div>
                <CardDescription>
                  {selectedBank.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedBank.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedBank.description}
                  </p>
                )}
                
                {selectedBank.website && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Website:</span>
                    <a 
                      href={selectedBank.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedBank.website}
                    </a>
                  </div>
                )}

                {selectedBank.logoPath && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Logo:</span>
                    <BankLogo 
                      logoPath={selectedBank.logoPath} 
                      bankName={selectedBank.name}
                      size="lg"
                    />
                    <span className="text-xs text-muted-foreground">
                      {selectedBank.logoPath}
                    </span>
                  </div>
                )}

                {(selectedBank.primaryColor || selectedBank.secondaryColor) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Cores:</span>
                    <div className="flex gap-1">
                      {selectedBank.primaryColor && (
                        <div 
                          className="w-4 h-4 rounded border border-border"
                          style={{ backgroundColor: selectedBank.primaryColor }}
                          title={`Cor principal: ${selectedBank.primaryColor}`}
                        />
                      )}
                      {selectedBank.secondaryColor && (
                        <div 
                          className="w-4 h-4 rounded border border-border"
                          style={{ backgroundColor: selectedBank.secondaryColor }}
                          title={`Cor secundária: ${selectedBank.secondaryColor}`}
                        />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDemo(false)}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button 
              onClick={() => setSelectedBankId(null)}
              variant="outline"
              className="flex-1"
            >
              Limpar Seleção
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas dos bancos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Banco de Dados de Bancos</CardTitle>
          <CardDescription>
            Estatísticas dos bancos disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {allBanks.filter(b => b.type === 'digital').length}
              </div>
              <div className="text-sm text-muted-foreground">Digitais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {allBanks.filter(b => b.type === 'traditional').length}
              </div>
              <div className="text-sm text-muted-foreground">Tradicionais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {allBanks.filter(b => b.type === 'fintech').length}
              </div>
              <div className="text-sm text-muted-foreground">Fintechs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {allBanks.length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankSelectorDemo;
