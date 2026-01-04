import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Shield, BarChart3, CreditCard, HeadphonesIcon, Clock, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";
import { Link } from "react-router-dom";

const features = [
  { icon: Zap, text: "Controle completo de gastos e receitas" },
  { icon: BarChart3, text: "Relatórios e análises avançadas" },
  { icon: CreditCard, text: "Gestão de cartões e faturas" },
  { icon: Shield, text: "Planejamento financeiro inteligente" },
  { icon: Sparkles, text: "Categorização automática com IA" },
  { icon: HeadphonesIcon, text: "Suporte prioritário" },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="container px-4 py-16 sm:py-20 md:py-24 bg-background">
      <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-finance-green/10 text-finance-green rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6"
        >
          <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">7 dias grátis para testar</span>
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-6 text-foreground px-2"
        >
          Um plano simples.
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          <span className="text-gradient">Acesso a tudo.</span>
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2"
        >
          Sem pegadinhas. Um valor único que cabe no seu bolso.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <CardSpotlight className="border-2 border-primary bg-card overflow-hidden relative">
          {/* Popular badge */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2">
            <div className="bg-primary text-primary-foreground px-4 sm:px-6 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-b-lg shadow-lg">
              Mais popular
            </div>
          </div>
          
          <div className="relative p-5 sm:p-8 md:p-10 pt-10 sm:pt-12">
            {/* Price comparison */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <span className="text-base sm:text-lg text-muted-foreground line-through">R$ 49</span>
                <span className="px-2 py-0.5 rounded bg-finance-green/10 text-finance-green text-xs sm:text-sm font-medium">
                  -70% OFF
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground">R$ 15</span>
                <span className="text-lg sm:text-xl text-muted-foreground">/mês</span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Menos de R$ 0,50 por dia
              </p>
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>
            
            {/* CTA Button */}
            <Link to="/auth" className="block">
              <Button className="button-gradient w-full text-base sm:text-lg py-5 sm:py-6 shadow-lg shadow-primary/25" size="lg">
                Começar 7 Dias Grátis
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-finance-green" />
                <span>Sem cartão</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-finance-green" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-finance-green" />
                <span>Dados seguros</span>
              </div>
            </div>
          </div>
        </CardSpotlight>
      </motion.div>
    </section>
  );
};
