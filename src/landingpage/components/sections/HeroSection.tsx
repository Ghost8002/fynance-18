import { motion } from "framer-motion";
import { ArrowRight, Users, TrendingUp, Shield, Star } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import { TextGenerateEffect } from "@/landingpage/components/ui/text-generate-effect";
import { FynanceLogo } from "@/components/shared/FynanceLogo";
import { Link } from "react-router-dom";

const stats = [
  { icon: Users, value: "10.000+", label: "Usuários ativos" },
  { icon: TrendingUp, value: "R$ 50M+", label: "Gerenciados" },
  { icon: Shield, value: "99.9%", label: "Uptime garantido" },
];

export const HeroSection = () => {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative container px-4 pt-40 pb-24"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-background" />
      
      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
      >
        <FynanceLogo size="sm" className="h-4 w-4" />
        <span className="text-sm font-medium text-primary">
          #1 em Gestão Financeira Pessoal
        </span>
        <div className="flex items-center gap-0.5 ml-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </motion.div>
      
      <div className="max-w-5xl relative z-10">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight text-left">
          <span className="text-foreground">
            <TextGenerateEffect words="Sua vida financeira" />
          </span>
          <br />
          <span className="text-gradient">
            <TextGenerateEffect words="sob controle total" />
          </span>
        </h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl text-left leading-relaxed"
        >
          Chega de planilhas bagunçadas e surpresas no fim do mês. 
          Com o Fynance, você tem <span className="text-foreground font-semibold">visão completa</span> das suas finanças, 
          <span className="text-foreground font-semibold"> alertas inteligentes</span> e <span className="text-foreground font-semibold">IA</span> que te ajuda a economizar mais.
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 items-start mb-12"
        >
          <Link to="/auth">
            <Button size="lg" className="button-gradient text-lg px-8 py-6 h-auto shadow-lg shadow-primary/25">
              Começar 7 Dias Grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-2" asChild>
            <a href="#features">
              Ver como funciona
            </a>
          </Button>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-8 items-center"
        >
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pt-8 border-t border-border/50"
        >
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-finance-green" />
              Dados criptografados
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-finance-green" />
              Sem cartão de crédito para começar
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-finance-green" />
              Cancele quando quiser
            </span>
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
};
