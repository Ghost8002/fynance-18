import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PrivacyPolicy = () => {
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
            <CardTitle className="text-3xl">Política de Privacidade</CardTitle>
            <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Fynance ("nós", "nosso" ou "empresa") está comprometida em proteger sua privacidade. 
                Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas 
                informações pessoais quando você usa nosso aplicativo de gestão financeira.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Informações que Coletamos</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="font-medium text-foreground">2.1 Informações fornecidas por você:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Nome e endereço de e-mail ao criar uma conta</li>
                  <li>Dados financeiros que você insere (transações, contas, orçamentos)</li>
                  <li>Informações de perfil e preferências</li>
                </ul>
                
                <p className="font-medium text-foreground mt-4">2.2 Informações coletadas automaticamente:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Dados de uso e navegação no aplicativo</li>
                  <li>Informações do dispositivo e navegador</li>
                  <li>Endereço IP e dados de localização aproximada</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Como Usamos suas Informações</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Fornecer e melhorar nossos serviços de gestão financeira</li>
                <li>Personalizar sua experiência no aplicativo</li>
                <li>Enviar notificações sobre suas finanças (se autorizado)</li>
                <li>Proteger contra fraudes e atividades não autorizadas</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Não vendemos suas informações pessoais. Podemos compartilhar dados apenas:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                <li>Com provedores de serviços essenciais (hospedagem, processamento de pagamentos)</li>
                <li>Quando exigido por lei ou ordem judicial</li>
                <li>Para proteger nossos direitos legais e segurança dos usuários</li>
                <li>Com seu consentimento explícito</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Segurança dos Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Autenticação segura e controle de acesso</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e planos de recuperação</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground leading-relaxed">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar seu consentimento a qualquer momento</li>
                <li>Solicitar portabilidade dos dados</li>
                <li>Obter informações sobre compartilhamento de dados</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para 
                fornecer nossos serviços. Após a exclusão da conta, seus dados serão removidos 
                em até 30 dias, exceto quando a retenção for exigida por lei.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
                lembrar suas preferências e analisar o uso do aplicativo. Você pode gerenciar 
                suas preferências de cookies nas configurações do seu navegador.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Alterações nesta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
                sobre alterações significativas por e-mail ou através do aplicativo. O uso 
                continuado após as alterações constitui aceitação da política atualizada.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
              </p>
              <div className="mt-3 p-4 bg-muted rounded-lg">
                <p className="font-medium">Fynance - Gestão Financeira</p>
                <p className="text-muted-foreground">E-mail: privacidade@fynance.app</p>
                <p className="text-muted-foreground">Encarregado de Dados (DPO): dpo@fynance.app</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
