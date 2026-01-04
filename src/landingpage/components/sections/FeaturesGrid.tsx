import { motion } from "framer-motion";
import { BarChart3, ShieldCheck, Wallet, ArrowUpDown, Check } from "lucide-react";

const features = [
  {
    title: "Dashboard Inteligente",
    description: "Visualize sua saúde financeira em tempo real com gráficos intuitivos e indicadores que importam.",
    icon: BarChart3,
    highlights: ["Gráficos interativos", "Resumo mensal automático", "Comparativo período a período"],
    color: "primary",
  },
  {
    title: "Gestão de Patrimônio",
    description: "Acompanhe todos os seus ativos e investimentos em um só lugar. Saiba exatamente quanto você tem.",
    icon: Wallet,
    highlights: ["Valorização automática", "Histórico de evolução", "Múltiplas categorias"],
    color: "finance-green",
  },
  {
    title: "Segurança Bancária",
    description: "Seus dados protegidos com criptografia de nível militar. Privacidade em primeiro lugar.",
    icon: ShieldCheck,
    highlights: ["Criptografia AES-256", "Backup automático", "Autenticação 2FA"],
    color: "finance-purple",
  },
  {
    title: "Relatórios Avançados",
    description: "Análises detalhadas que revelam padrões ocultos e oportunidades de economia.",
    icon: ArrowUpDown,
    highlights: ["Exportar para Excel", "Gráficos personalizados", "Insights com IA"],
    color: "finance-yellow",
  },
];

export const FeaturesGrid = () => {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 bg-muted/20">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Funcionalidades
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            Tudo que você precisa para
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span className="text-gradient">dominar suas finanças</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Ferramentas profissionais em uma interface simples.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
              </div>
              
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                {feature.title}
              </h3>
              
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                {feature.description}
              </p>
              
              <ul className="space-y-1.5 sm:space-y-2">
                {feature.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-finance-green flex-shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
