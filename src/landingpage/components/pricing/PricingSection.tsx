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
    <section id="pricing" className="container px-4 py-24 bg-background">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-finance-green/10 text-finance-green rounded-full px-4 py-2 mb-6"
        >
          <Gift className="w-4 h-4" />
          <span className="text-sm font-medium">7 dias grátis para testar</span>
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground"
        >
          Um plano simples.<br />
          <span className="text-gradient">Acesso a tudo.</span>
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Sem pegadinhas, sem planos confusos. Um valor único que cabe no seu bolso.
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
            <div className="bg-primary text-primary-foreground px-6 py-1.5 text-sm font-semibold rounded-b-lg shadow-lg">
              Mais popular
            </div>
          </div>
          
          <div className="relative p-8 md:p-10 pt-12">
            {/* Price comparison */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-lg text-muted-foreground line-through">R$ 49</span>
                <span className="px-2 py-0.5 rounded bg-finance-green/10 text-finance-green text-sm font-medium">
                  -70% OFF
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-6xl md:text-7xl font-bold text-foreground">R$ 15</span>
                <span className="text-xl text-muted-foreground">/mês</span>
              </div>
              <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Menos de R$ 0,50 por dia
              </p>
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>
            
            {/* CTA Button */}
            <Link to="/auth">
              <Button className="button-gradient w-full text-lg py-6 shadow-lg shadow-primary/25" size="lg">
                Começar 7 Dias Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-finance-green" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-finance-green" />
                <span>Cancele a qualquer momento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-finance-green" />
                <span>Dados criptografados</span>
              </div>
            </div>
          </div>
        </CardSpotlight>
      </motion.div>
    </section>
  );
};
