
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const FrequentlyAskedQuestions = () => {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Pesquisar perguntas frequentes..."
          className="pl-9 w-full max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Como adicionar uma nova transação?</AccordionTrigger>
              <AccordionContent>
                Para adicionar uma nova transação, vá até a página "Transações" e clique no botão "Adicionar Transação" 
                no canto superior direito. Preencha os detalhes como descrição, valor, data e categoria, e clique em 
                "Salvar". A transação será adicionada ao seu histórico financeiro.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Como definir um orçamento mensal?</AccordionTrigger>
              <AccordionContent>
                Na página "Orçamentos", clique em "Adicionar Orçamento". Selecione a categoria para a qual deseja 
                estabelecer um limite, defina o valor máximo e o período. Você também pode adicionar uma descrição 
                opcional. Após salvar, o sistema rastreará seus gastos e alertará quando você estiver se aproximando 
                do limite definido.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Como criar uma meta financeira?</AccordionTrigger>
              <AccordionContent>
                Acesse a página "Metas" e clique em "Criar Meta". Defina um título para sua meta, o valor total que 
                deseja alcançar e a data limite. Se já tiver um valor guardado, você pode adicionar como valor inicial. 
                Você pode acompanhar seu progresso e adicionar valores à sua meta ao longo do tempo.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Posso sincronizar minhas contas bancárias automaticamente?</AccordionTrigger>
              <AccordionContent>
                Atualmente, a sincronização automática com contas bancárias está em desenvolvimento. Por enquanto, 
                você pode adicionar suas contas manualmente e registrar transações individualmente. Estamos trabalhando 
                para implementar a integração com Open Finance em breve.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Como exportar meus dados financeiros?</AccordionTrigger>
              <AccordionContent>
                Para exportar seus dados, vá até a página "Relatórios" e selecione o tipo de relatório que deseja. 
                Após visualizar os dados, clique no botão "Exportar" e escolha o formato desejado (PDF, Excel ou CSV). 
                O arquivo será gerado e disponibilizado para download.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Como alterar minha senha?</AccordionTrigger>
              <AccordionContent>
                Para alterar sua senha, acesse "Configurações" e selecione a aba "Segurança". Na seção "Alteração de Senha", 
                digite sua senha atual, a nova senha desejada e confirme a nova senha. Clique em "Atualizar senha" para 
                salvar as alterações.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>É possível programar pagamentos recorrentes?</AccordionTrigger>
              <AccordionContent>
                Sim, ao adicionar uma nova transação, você pode marcar a opção "Transação recorrente" e definir a 
                frequência (mensal, semanal, anual). O sistema criará automaticamente as transações futuras de acordo 
                com a programação, e você receberá lembretes conforme suas configurações de notificação.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default FrequentlyAskedQuestions;
