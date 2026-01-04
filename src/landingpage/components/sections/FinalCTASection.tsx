import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import { Link } from "react-router-dom";

const guarantees = [
  "7 dias grátis para testar",
  "Sem cartão de crédito",
  "Cancele quando quiser",
  "Suporte humanizado",
];

export const FinalCTASection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-finance-green/10 text-finance-green text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Oferta especial por tempo limitado
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Comece a organizar suas<br />
            <span className="text-gradient">finanças hoje mesmo</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a mais de 10.000 pessoas que já transformaram sua relação com o dinheiro. 
            Seu eu do futuro vai agradecer.
          </p>

          {/* Price highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex flex-col items-center gap-2 mb-8 p-6 rounded-2xl bg-card border-2 border-primary/20"
          >
            <span className="text-muted-foreground">Acesso completo por apenas</span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl md:text-6xl font-bold text-foreground">R$ 15</span>
              <span className="text-xl text-muted-foreground">/mês</span>
            </div>
            <span className="text-sm text-finance-green font-medium">
              Menos de R$ 0,50 por dia
            </span>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <Link to="/auth">
              <Button size="lg" className="button-gradient text-lg px-12 py-7 h-auto shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all">
                Quero começar agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Guarantees */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-6"
          >
            {guarantees.map((guarantee, index) => (
              <span key={index} className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-5 h-5 text-finance-green" />
                {guarantee}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
