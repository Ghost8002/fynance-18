
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Shield, BarChart3, CreditCard, HeadphonesIcon } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";

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
    <section className="container px-4 py-24 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-6"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Oferta Especial</span>
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl md:text-5xl lg:text-6xl font-normal mb-6 text-gray-900 dark:text-gray-100"
        >
          Acesso completo por apenas{" "}
          <span className="text-gradient font-bold">R$ 15/mês</span>
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
        >
          Todas as ferramentas que você precisa para organizar suas finanças pessoais em um único plano acessível
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <CardSpotlight className="border-2 border-primary bg-white dark:bg-gray-800 overflow-hidden">
          <div className="relative p-8 md:p-10">
            {/* Badge */}
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-medium rounded-bl-lg">
              Premium
            </div>
            
            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-gray-100">R$ 15</span>
                <span className="text-xl text-gray-500 dark:text-gray-400">/mês</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Cancele quando quiser, sem compromisso
              </p>
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature.text}</span>
                </motion.div>
              ))}
            </div>
            
            {/* CTA Button */}
            <Button className="button-gradient w-full text-lg py-6" size="lg">
              Começar Agora
            </Button>
            
            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>7 dias grátis</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>Sem taxas ocultas</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>Dados seguros</span>
              </div>
            </div>
          </div>
        </CardSpotlight>
      </motion.div>
    </section>
  );
};
