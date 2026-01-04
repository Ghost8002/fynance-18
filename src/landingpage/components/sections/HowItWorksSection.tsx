import { motion } from "framer-motion";
import { CreditCard, PieChart, TrendingUp, Target } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: CreditCard,
    title: "Cadastre suas contas",
    description: "Adicione suas contas bancárias, cartões de crédito e investimentos em minutos.",
  },
  {
    number: "02",
    icon: PieChart,
    title: "Registre suas transações",
    description: "Categorize seus gastos e receitas automaticamente ou importe extratos.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Acompanhe sua evolução",
    description: "Visualize gráficos e relatórios que mostram para onde vai seu dinheiro.",
  },
  {
    number: "04",
    icon: Target,
    title: "Alcance seus objetivos",
    description: "Defina metas financeiras e receba insights personalizados com IA.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-background">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-finance-green/10 text-finance-green text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Simples e Rápido
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            Como o Fynance funciona?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Em apenas 4 passos, você terá controle total das suas finanças.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}
              
              <div className="relative bg-card rounded-2xl p-6 sm:p-8 border border-border hover:border-primary/50 transition-all duration-300 h-full">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
