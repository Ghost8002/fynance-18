import { motion } from "framer-motion";
import { ArrowRight, Users, TrendingUp, Shield, Star } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import { TextGenerateEffect } from "@/landingpage/components/ui/text-generate-effect";
import { FynanceLogo } from "@/components/shared/FynanceLogo";
import { Link } from "react-router-dom";

const stats = [
  { icon: Users, value: "10.000+", label: "Usuários ativos" },
  { icon: TrendingUp, value: "R$ 50M+", label: "Gerenciados" },
  { icon: Shield, value: "99.9%", label: "Uptime" },
];

export const HeroSection = () => {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative container px-4 pt-28 sm:pt-32 md:pt-40 pb-16 md:pb-24"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-background" />
      
      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20"
      >
        <FynanceLogo size="sm" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="text-xs sm:text-sm font-medium text-primary">
          #1 em Gestão Financeira
        </span>
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </motion.div>
      
      <div className="max-w-5xl relative z-10">
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 tracking-tight text-left">
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
          className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl text-left leading-relaxed"
        >
          Chega de planilhas bagunçadas. Com o Fynance, você tem{" "}
          <span className="text-foreground font-semibold">visão completa</span> das suas finanças e{" "}
          <span className="text-foreground font-semibold">IA</span> que te ajuda a economizar.
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12"
        >
          <Link to="/auth" className="w-full sm:w-auto">
            <Button size="lg" className="button-gradient text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto shadow-lg shadow-primary/25 w-full sm:w-auto">
              Começar 7 Dias Grátis
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto border-2 w-full sm:w-auto" asChild>
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
          className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-6 md:gap-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="text-base sm:text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border/50"
        >
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-finance-green" />
              Dados criptografados
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-finance-green" />
              Sem cartão para começar
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-finance-green" />
              Cancele quando quiser
            </span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
