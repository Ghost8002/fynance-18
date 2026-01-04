import { motion } from "framer-motion";
import { 
  Clock, 
  Brain, 
  PiggyBank, 
  AlertTriangle,
  TrendingUp,
  CreditCard
} from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Economize 5 horas/mês",
    description: "Chega de planilhas manuais. Importação automática de extratos e categorização inteligente.",
    highlight: "5h",
  },
  {
    icon: Brain,
    title: "IA que te conhece",
    description: "Nossa IA aprende seus hábitos e sugere onde você pode cortar gastos sem sacrifícios.",
    highlight: "IA",
  },
  {
    icon: PiggyBank,
    title: "Economize +20% todo mês",
    description: "Usuários do Fynance economizam em média 20% a mais identificando gastos desnecessários.",
    highlight: "20%",
  },
  {
    icon: AlertTriangle,
    title: "Nunca mais esqueça uma conta",
    description: "Alertas inteligentes antes do vencimento. Evite multas e juros que corroem seu patrimônio.",
    highlight: "0",
  },
  {
    icon: TrendingUp,
    title: "Visualize seu progresso",
    description: "Gráficos claros mostram sua evolução financeira. Metas que você realmente consegue atingir.",
    highlight: "📈",
  },
  {
    icon: CreditCard,
    title: "Controle total dos cartões",
    description: "Gerencie faturas, parcelas e limite. Saiba exatamente quanto vai pagar no próximo mês.",
    highlight: "💳",
  },
];

export const BenefitsSection = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-finance-green/10 text-finance-green text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Por que escolher o Fynance?
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            Pare de perder dinheiro por
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span className="text-gradient">falta de organização</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            A maioria perde até R$ 500/mês com gastos esquecidos. O Fynance mostra para onde seu dinheiro está indo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-2xl sm:text-4xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                {benefit.highlight}
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1.5 sm:mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
