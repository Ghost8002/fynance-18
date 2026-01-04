import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import { Link } from "react-router-dom";

const guarantees = [
  "Sem cartão de crédito",
  "Cancele quando quiser",
  "Suporte humanizado",
];

export const FinalCTASection = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-primary/10 rounded-full blur-3xl" />
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
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-finance-green/10 text-finance-green text-xs sm:text-sm font-medium mb-4 sm:mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Oferta especial por tempo limitado
          </motion.div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-2">
            Comece a organizar suas
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span className="text-gradient">finanças hoje mesmo</span>
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Junte-se a mais de 10.000 pessoas que já transformaram sua relação com o dinheiro.
          </p>

          {/* Price highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex flex-col items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border-2 border-primary/20"
          >
            <span className="text-sm sm:text-base text-muted-foreground">Acesso completo por apenas</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">R$ 15</span>
              <span className="text-lg sm:text-xl text-muted-foreground">/mês</span>
            </div>
            <span className="text-xs sm:text-sm text-finance-green font-medium">
              Menos de R$ 0,50 por dia
            </span>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 sm:mb-8"
          >
            <Link to="/auth" className="inline-block w-full sm:w-auto group">
              <Button 
                size="lg" 
                className="button-gradient text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-7 h-auto shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all w-full sm:w-auto relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  Quero começar agora
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "linear",
                  }}
                />
              </Button>
            </Link>
          </motion.div>

          {/* Urgency message */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm text-muted-foreground mb-4"
          >
            ⚡ <span className="font-semibold text-foreground">Últimas 24h:</span> 89 pessoas começaram a economizar hoje
          </motion.p>

          {/* Guarantees */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-6"
          >
            {guarantees.map((guarantee, index) => (
              <span key={index} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-finance-green flex-shrink-0" />
                <span>{guarantee}</span>
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
