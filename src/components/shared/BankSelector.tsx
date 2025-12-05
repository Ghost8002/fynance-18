import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Plus, Building2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCustomBanks } from "@/hooks/useCustomBanks";
import { BankInfo, searchBanks, getPopularBanks, getAllActiveBanks } from "@/utils/banks/bankDatabase";
import BankLogo from "./BankLogo";
import { devError } from "@/utils/logger";

interface BankSelectorProps {
  selectedBankId?: string;
  onBankChange: (bankId: string | null) => void;
  placeholder?: string;
  className?: string;
}

interface CustomBankFormData {
  name: string;
  shortName: string;
  website?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const BankSelector = ({ 
  selectedBankId, 
  onBankChange, 
  placeholder = "Selecionar banco...",
  className 
}: BankSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customBankForm, setCustomBankForm] = useState<CustomBankFormData>({
    name: "",
    shortName: "",
    website: "",
    description: "",
    primaryColor: "",
    secondaryColor: ""
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { customBanks, createCustomBank } = useCustomBanks();

  // Buscar bancos baseado na query
  const allBanks = getAllActiveBanks();
  
  // Combinar bancos padrão com bancos customizados
  const allAvailableBanks = [...allBanks, ...customBanks.map(cb => ({
    id: `custom_${cb.id}`,
    name: cb.name,
    shortName: cb.short_name,
    logoPath: '',
    alternativeLogos: [],
    type: 'custom' as const,
    isActive: cb.is_active,
    website: cb.website,
    description: cb.description,
    primaryColor: cb.primary_color,
    secondaryColor: cb.secondary_color
  }))];

  // Filtrar bancos baseado na query
  const filteredBanks = searchQuery 
    ? allAvailableBanks.filter(bank => 
        bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bank.shortName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getPopularBanks();

  // Buscar banco selecionado
  const selectedBank = selectedBankId ? allAvailableBanks.find(bank => bank.id === selectedBankId) : null;

  const handleBankSelect = (bankId: string) => {
    onBankChange(bankId);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCustomBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customBankForm.name.trim() || !customBankForm.shortName.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome e nome curto são obrigatórios"
      });
      return;
    }

    try {
      const newBank = await createCustomBank({
        name: customBankForm.name.trim(),
        short_name: customBankForm.shortName.trim(),
        website: customBankForm.website?.trim() || undefined,
        description: customBankForm.description?.trim() || undefined,
        primary_color: customBankForm.primaryColor?.trim() || undefined,
        secondary_color: customBankForm.secondaryColor?.trim() || undefined
      });

      toast({
        title: "Banco criado",
        description: `"${customBankForm.name}" foi adicionado com sucesso`
      });

      // Selecionar o banco recém-criado
      onBankChange(`custom_${newBank.id}`);
      
      // Reset form
      setCustomBankForm({
        name: "",
        shortName: "",
        website: "",
        description: "",
        primaryColor: "",
        secondaryColor: ""
      });
      
      setShowCustomForm(false);
      setOpen(false);
      setSearchQuery("");

    } catch (error) {
      devError("Erro ao criar banco:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o banco. Tente novamente."
      });
    }
  };

  const handleInputChange = (field: keyof CustomBankFormData, value: string) => {
    setCustomBankForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Banco</Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              {selectedBank ? (
                <>
                  <BankLogo 
                    logoPath={selectedBank.logoPath} 
                    bankName={selectedBank.name}
                    size="sm"
                  />
                  <span className="truncate">{selectedBank.shortName}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar banco..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="mb-2">Nenhum banco encontrado</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomForm(true)}
                    className="mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar novo banco
                  </Button>
                </div>
              </CommandEmpty>

              {filteredBanks.length > 0 && (
                <CommandGroup>
                  {filteredBanks.map((bank) => (
                    <CommandItem
                      key={bank.id}
                      value={bank.name}
                      onSelect={() => handleBankSelect(bank.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedBankId === bank.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-3">
                        <BankLogo 
                          logoPath={bank.logoPath} 
                          bankName={bank.name}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{bank.shortName}</div>
                          <div className="text-sm text-muted-foreground">{bank.name}</div>
                        </div>
                        {bank.primaryColor && (
                          <div 
                            className="w-3 h-3 rounded-full border border-border"
                            style={{ backgroundColor: bank.primaryColor }}
                            title={`Cor principal: ${bank.primaryColor}`}
                          />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchQuery && (
                <CommandGroup heading="Criar novo banco">
                  <CommandItem
                    onSelect={() => setShowCustomForm(true)}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar "{searchQuery}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialog para criação de banco customizado */}
      <Dialog open={showCustomForm} onOpenChange={setShowCustomForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Banco</DialogTitle>
            <DialogDescription>
              Adicione um banco que não está na nossa lista
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCustomBankSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nome do Banco *</Label>
              <Input
                id="bankName"
                value={customBankForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Banco Exemplo S.A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankShortName">Nome Curto *</Label>
              <Input
                id="bankShortName"
                value={customBankForm.shortName}
                onChange={(e) => handleInputChange('shortName', e.target.value)}
                placeholder="Ex: Exemplo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankWebsite">Website</Label>
              <Input
                id="bankWebsite"
                type="url"
                value={customBankForm.website || ""}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://exemplo.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankDescription">Descrição</Label>
              <Input
                id="bankDescription"
                value={customBankForm.description || ""}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Breve descrição do banco"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Principal</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={customBankForm.primaryColor || "#3B82F6"}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={customBankForm.primaryColor || ""}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={customBankForm.secondaryColor || "#FFFFFF"}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={customBankForm.secondaryColor || ""}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Criar Banco
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankSelector;
