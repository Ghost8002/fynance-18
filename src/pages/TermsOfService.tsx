import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Termos de Uso</CardTitle>
            <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e usar o Fynance ("Serviço"), você concorda em cumprir e estar vinculado 
                a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, 
                não poderá acessar o Serviço.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                O Fynance é uma plataforma de gestão financeira pessoal que permite aos usuários:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                <li>Registrar e categorizar transações financeiras</li>
                <li>Gerenciar contas bancárias e cartões de crédito</li>
                <li>Criar orçamentos e acompanhar metas financeiras</li>
                <li>Visualizar relatórios e análises financeiras</li>
                <li>Receber insights e recomendações personalizadas</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Registro e Conta</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">3.1</span> Você deve fornecer informações 
                  precisas e completas ao criar uma conta.
                </p>
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">3.2</span> Você é responsável por manter 
                  a confidencialidade de sua senha e por todas as atividades em sua conta.
                </p>
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">3.3</span> Você deve notificar-nos 
                  imediatamente sobre qualquer uso não autorizado de sua conta.
                </p>
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">3.4</span> Você deve ter pelo menos 
                  18 anos para usar este Serviço.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Uso Aceitável</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Você concorda em não usar o Serviço para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Violar qualquer lei ou regulamento aplicável</li>
                <li>Transmitir material ilegal, fraudulento ou prejudicial</li>
                <li>Interferir ou interromper o funcionamento do Serviço</li>
                <li>Tentar acessar sistemas ou dados não autorizados</li>
                <li>Usar automação não autorizada (bots, scrapers, etc.)</li>
                <li>Compartilhar sua conta com terceiros</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                O Serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão 
                propriedade exclusiva da Fynance. O Serviço é protegido por direitos autorais, 
                marcas registradas e outras leis. Nossos logotipos e marcas não podem ser usados 
                sem autorização prévia por escrito.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Dados do Usuário</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">6.1</span> Você mantém todos os direitos 
                  sobre os dados financeiros que insere no Serviço.
                </p>
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">6.2</span> Você nos concede uma licença 
                  limitada para processar seus dados conforme necessário para fornecer o Serviço.
                </p>
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">6.3</span> O tratamento de seus dados 
                  está sujeito à nossa Política de Privacidade.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Planos e Pagamentos</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">7.1</span> O Serviço pode oferecer 
                  planos gratuitos e pagos com diferentes recursos.
                </p>
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">7.2</span> Os pagamentos são processados 
                  de forma segura através de provedores terceirizados.
                </p>
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">7.3</span> Assinaturas são renovadas 
                  automaticamente, salvo cancelamento prévio.
                </p>
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground">7.4</span> Reembolsos estão sujeitos 
                  à nossa política de reembolso vigente.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Isenção de Garantias</h2>
              <p className="text-muted-foreground leading-relaxed">
                O Serviço é fornecido "como está" e "conforme disponível". Não garantimos que o 
                Serviço será ininterrupto, seguro ou livre de erros. Não somos consultores 
                financeiros e o Serviço não constitui aconselhamento financeiro profissional.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                Em nenhuma circunstância a Fynance será responsável por danos indiretos, 
                incidentais, especiais ou consequentes, incluindo perda de lucros, dados ou 
                oportunidades de negócio, resultantes do uso ou impossibilidade de uso do Serviço.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Encerramento</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, por 
                violação destes Termos. Você pode encerrar sua conta a qualquer momento através 
                das configurações. Após o encerramento, seu direito de usar o Serviço cessará 
                imediatamente.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Alterações nos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. 
                Notificaremos sobre alterações significativas por e-mail ou através do Serviço. 
                O uso continuado após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Lei Aplicável</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos são regidos pelas leis da República Federativa do Brasil. 
                Qualquer disputa será submetida à jurisdição exclusiva dos tribunais brasileiros.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas sobre estes Termos, entre em contato:
              </p>
              <div className="mt-3 p-4 bg-muted rounded-lg">
                <p className="font-medium">Fynance - Gestão Financeira</p>
                <p className="text-muted-foreground">E-mail: contato@fynance.app</p>
                <p className="text-muted-foreground">Suporte: suporte@fynance.app</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
