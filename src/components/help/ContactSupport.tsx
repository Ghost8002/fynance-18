import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FormEvent } from "react";
import { Mail, MessageSquare, Phone } from "lucide-react";
const ContactSupport = () => {
  const {
    toast
  } = useToast();
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mensagem enviada",
      description: "Agradecemos seu contato. Responderemos em breve!"
    });
  };
  return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Mail className="h-10 w-10 text-finance-blue mb-4" />
            <h3 className="text-lg font-medium mb-2">E-mail</h3>
            <p className="text-gray-500 mb-4">suporte@fynance.com</p>
            <p className="text-sm text-gray-500">
              Respondemos em até 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Phone className="h-10 w-10 text-finance-blue mb-4" />
            <h3 className="text-lg font-medium mb-2">Telefone</h3>
            <p className="text-gray-500 mb-4">+55 (99) 98481-6847</p>
            <p className="text-sm text-gray-500">
              Seg-Sex, 9h às 18h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <MessageSquare className="h-10 w-10 text-finance-blue mb-4" />
            <h3 className="text-lg font-medium mb-2">Chat</h3>
            <p className="text-gray-500 mb-4">
              Atendimento online
            </p>
            <Button>Iniciar chat</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Envie uma mensagem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="Digite seu nome" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu.email@exemplo.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Select>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Selecione um assunto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Problemas com conta</SelectItem>
                  <SelectItem value="technical">Problema técnico</SelectItem>
                  <SelectItem value="billing">Faturamento</SelectItem>
                  <SelectItem value="feature">Sugestão de funcionalidade</SelectItem>
                  <SelectItem value="other">Outro assunto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea id="message" placeholder="Descreva sua dúvida ou problema em detalhes..." className="min-h-32" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Anexo (opcional)</Label>
              <Input id="attachment" type="file" />
              <p className="text-xs text-gray-500">
                Você pode anexar uma captura de tela ou documento relevante (máx. 5MB)
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="bg-finance-blue hover:bg-finance-blue/90" onClick={handleSubmit}>
            Enviar mensagem
          </Button>
        </CardFooter>
      </Card>
    </div>;
};
export default ContactSupport;