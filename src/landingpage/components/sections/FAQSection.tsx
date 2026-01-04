import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O Fynance é realmente seguro?",
    answer: "Sim! Utilizamos criptografia de nível bancário (AES-256) para proteger seus dados. Seus dados nunca são compartilhados com terceiros e você pode excluir sua conta a qualquer momento.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Absolutamente! Não há fidelidade ou multa de cancelamento. Você pode cancelar sua assinatura a qualquer momento diretamente pelo painel, sem burocracia.",
  },
  {
    question: "Como funciona o período de teste grátis?",
    answer: "Você tem 7 dias para testar todas as funcionalidades premium sem compromisso. Não pedimos cartão de crédito para iniciar o teste. Só paga se decidir continuar.",
  },
  {
    question: "Preciso conectar minha conta bancária?",
    answer: "Não é obrigatório! Você pode adicionar suas transações manualmente ou importar extratos. A conexão bancária é opcional e oferece mais praticidade.",
  },
  {
    question: "Funciona para empresas também?",
    answer: "O Fynance foi desenhado para finanças pessoais e de pequenos empreendedores. Para empresas maiores, entre em contato conosco para soluções personalizadas.",
  },
  {
    question: "Tem aplicativo para celular?",
    answer: "Sim! O Fynance funciona perfeitamente no navegador do celular como um PWA. Você pode até adicionar na tela inicial para acesso rápido como um app nativo.",
  },
];

export const FAQSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Dúvidas frequentes
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Tudo que você precisa<br />
            <span className="text-gradient">saber antes de começar</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left text-lg font-medium text-foreground hover:text-primary py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
