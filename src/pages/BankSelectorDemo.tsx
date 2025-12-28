import AppLayout from "@/components/shared/AppLayout";
import BankSelectorDemo from "@/components/shared/BankSelectorDemo";

const BankSelectorDemoPage = () => {

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Demonstração do Seletor de Bancos
          </h1>
          <p className="text-muted-foreground">
            Teste a nova funcionalidade de seleção de bancos integrada às abas Cartões e Contas
          </p>
        </div>

        <BankSelectorDemo />
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Funcionalidades Implementadas</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Banco de dados com 20+ bancos brasileiros
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Busca inteligente por nome
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Logos em SVG de alta qualidade
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Criação dinâmica de bancos customizados
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Integração com formulários de Cartões
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Integração com formulários de Contas
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Como Usar</h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <strong>1. Seleção:</strong> Clique no campo "Selecionar banco..." e digite o nome do banco desejado
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <strong>2. Busca:</strong> O sistema busca automaticamente bancos que correspondam ao texto digitado
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <strong>3. Criação:</strong> Se o banco não existir, clique em "Criar novo banco" para adicioná-lo
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <strong>4. Visualização:</strong> Veja informações do banco selecionado, incluindo tipo e website
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-6">
          <p className="text-sm text-muted-foreground">
            Esta funcionalidade está agora disponível nas abas <strong>Cartões</strong> e <strong>Contas</strong>
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default BankSelectorDemoPage;
