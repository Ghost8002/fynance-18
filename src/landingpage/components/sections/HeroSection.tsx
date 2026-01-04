import { motion } from "framer-motion";
import { ArrowRight, Users, TrendingUp, Shield, Star, BarChart3, Wallet, Calendar } from "lucide-react";
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
      
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left column - Text content */}
        <div className="relative z-10">
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
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight text-left">
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
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-xl text-left leading-relaxed"
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
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10"
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
            className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-6"
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

        {/* Right column - Product mockup */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative hidden lg:block"
        >
          {/* Main dashboard mockup */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-finance-green/20 rounded-2xl blur-3xl opacity-50" />
            
            {/* Dashboard card */}
            <div className="relative bg-card border border-border rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FynanceLogo size="sm" />
                  <span className="font-semibold text-foreground">Dashboard</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
              </div>
              
              {/* Balance card */}
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-4 mb-4 text-primary-foreground">
                <p className="text-sm opacity-80 mb-1">Saldo Total</p>
                <p className="text-2xl font-bold">R$ 24.580,00</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12.5% este mês</span>
                </div>
              </div>
              
              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-sm font-semibold text-finance-green">R$ 8.500</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Wallet className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Despesas</p>
                  <p className="text-sm font-semibold text-finance-red">R$ 4.200</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">A pagar</p>
                  <p className="text-sm font-semibold text-finance-yellow">R$ 1.800</p>
                </div>
              </div>
              
              {/* Chart placeholder */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-end justify-between h-20 gap-2">
                  {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-primary/60 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Seg</span>
                  <span>Ter</span>
                  <span>Qua</span>
                  <span>Qui</span>
                  <span>Sex</span>
                  <span>Sáb</span>
                  <span>Dom</span>
                </div>
              </div>
            </div>

            {/* Floating notification card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl p-3 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-finance-green/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-finance-green" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Meta alcançada!</p>
                  <p className="text-sm font-semibold text-foreground">R$ 5.000 economizados</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
