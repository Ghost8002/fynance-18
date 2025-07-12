
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, FileText, Download, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

const Documentation = () => {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Pesquisar na documentação..."
          className="pl-9 w-full max-w-md"
        />
      </div>

      <Tabs defaultValue="guides" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="guides">Guias</TabsTrigger>
          <TabsTrigger value="articles">Artigos</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
        </TabsList>
        
        <TabsContent value="guides">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-finance-blue" />
                  Manual do Usuário
                </CardTitle>
                <CardDescription>
                  Guia completo com todos os recursos do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Navegue pelo manual completo que explica todas as funcionalidades disponíveis no Vida Financeira.
                </p>
                <Button variant="outline" className="w-full">Acessar Manual</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-finance-blue" />
                  Guia de Início Rápido
                </CardTitle>
                <CardDescription>
                  Primeiros passos para novos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Um guia simplificado para começar a usar o sistema rapidamente e aproveitar seus principais recursos.
                </p>
                <Button variant="outline" className="w-full">Ler Guia</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-finance-blue" />
                  Perguntas Frequentes
                </CardTitle>
                <CardDescription>
                  Respostas para dúvidas comuns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Encontre respostas para as perguntas mais comuns sobre o uso do sistema e suas funcionalidades.
                </p>
                <Button variant="outline" className="w-full">Ver FAQ</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="articles">
          <div className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Artigos e Tutoriais</CardTitle>
                <CardDescription>
                  Aprenda mais sobre gestão financeira e como utilizar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 mr-3 text-finance-blue shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Como criar um orçamento eficiente</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Aprenda a criar orçamentos realistas que funcionam para suas necessidades financeiras.
                      </p>
                      <Button variant="link" className="h-auto p-0 text-finance-blue">Ler artigo</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 mr-3 text-finance-blue shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">5 dicas para economizar dinheiro</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Estratégias práticas para aumentar sua economia mensal e atingir suas metas.
                      </p>
                      <Button variant="link" className="h-auto p-0 text-finance-blue">Ler artigo</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 mr-3 text-finance-blue shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Gerenciando dívidas de forma inteligente</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Como organizar e quitar suas dívidas de maneira estratégica e rápida.
                      </p>
                      <Button variant="link" className="h-auto p-0 text-finance-blue">Ler artigo</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 mr-3 text-finance-blue shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Análise avançada de relatórios financeiros</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Como extrair insights valiosos dos seus dados financeiros para tomar melhores decisões.
                      </p>
                      <Button variant="link" className="h-auto p-0 text-finance-blue">Ler artigo</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="downloads">
          <div className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos para Download</CardTitle>
                <CardDescription>
                  Recursos úteis para acompanhar suas finanças
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Download className="h-5 w-5 mr-3 text-finance-blue" />
                      <div>
                        <h3 className="font-medium">Manual do Usuário (PDF)</h3>
                        <p className="text-sm text-gray-500">Manual completo em PDF para leitura offline</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Download</Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Download className="h-5 w-5 mr-3 text-finance-blue" />
                      <div>
                        <h3 className="font-medium">Planilha de Orçamento (Excel)</h3>
                        <p className="text-sm text-gray-500">Modelo para acompanhamento manual</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Download</Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Download className="h-5 w-5 mr-3 text-finance-blue" />
                      <div>
                        <h3 className="font-medium">Guia de Categorias (PDF)</h3>
                        <p className="text-sm text-gray-500">Lista completa de categorias para organização</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Download</Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Download className="h-5 w-5 mr-3 text-finance-blue" />
                      <div>
                        <h3 className="font-medium">Calendário Financeiro (PDF)</h3>
                        <p className="text-sm text-gray-500">Calendario anual para planejamento</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Download</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documentation;
