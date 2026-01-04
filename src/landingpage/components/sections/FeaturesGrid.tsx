import { motion } from "framer-motion";
import { BarChart3, ShieldCheck, Wallet, ArrowUpDown, Check, Smartphone, Bell, Calendar } from "lucide-react";

const features = [
  {
    title: "Dashboard Inteligente",
    description: "Visualize sua saúde financeira em tempo real com gráficos intuitivos.",
    icon: BarChart3,
    highlights: ["Gráficos interativos", "Resumo mensal automático", "Comparativo período a período"],
    color: "primary",
    preview: {
      type: "chart",
      data: [30, 50, 40, 70, 55, 80, 65],
    },
  },
  {
    title: "Gestão de Patrimônio",
    description: "Acompanhe todos os seus ativos e investimentos em um só lugar.",
    icon: Wallet,
    highlights: ["Valorização automática", "Histórico de evolução", "Múltiplas categorias"],
    color: "finance-green",
    preview: {
      type: "balance",
      value: "R$ 24.580",
      change: "+12.5%",
    },
  },
  {
    title: "Calendário Financeiro",
    description: "Nunca perca uma conta. Visualize todas as datas importantes.",
    icon: Calendar,
    highlights: ["Lembretes automáticos", "Contas recorrentes", "Visão mensal"],
    color: "finance-purple",
    preview: {
      type: "calendar",
    },
  },
  {
    title: "Relatórios Avançados",
    description: "Análises detalhadas que revelam padrões e oportunidades.",
    icon: ArrowUpDown,
    highlights: ["Exportar para Excel", "Gráficos personalizados", "Insights com IA"],
    color: "finance-yellow",
    preview: {
      type: "stats",
      items: [
        { label: "Economia", value: "23%" },
        { label: "Meta", value: "87%" },
      ],
    },
  },
];

const FeaturePreview = ({ preview }: { preview: typeof features[0]["preview"] }) => {
  if (preview.type === "chart") {
    return (
      <div className="flex items-end justify-between h-12 gap-1 px-2">
        {preview.data.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-primary/80 to-primary/40 rounded-t transition-all group-hover:from-primary group-hover:to-primary/60"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    );
  }
  
  if (preview.type === "balance") {
    return (
      <div className="px-3 py-2">
        <p className="text-lg font-bold text-foreground">{preview.value}</p>
        <p className="text-xs text-finance-green font-medium">{preview.change} este mês</p>
      </div>
    );
  }
  
  if (preview.type === "calendar") {
    return (
      <div className="grid grid-cols-7 gap-0.5 px-2 py-1">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded text-[8px] flex items-center justify-center ${
              i === 2 ? "bg-primary text-primary-foreground" : 
              i === 5 ? "bg-finance-red/20 text-finance-red" : 
              "bg-muted text-muted-foreground"
            }`}
          >
            {15 + i}
          </div>
        ))}
      </div>
    );
  }
  
  if (preview.type === "stats") {
    return (
      <div className="flex gap-3 px-3 py-1">
        {preview.items.map((item, i) => (
          <div key={i} className="text-center">
            <p className="text-sm font-bold text-foreground">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    );
  }
  
  return null;
};

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
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
                </div>
                
                {/* Mini preview */}
                <div className="hidden sm:block bg-muted/50 rounded-lg overflow-hidden border border-border/50">
                  <FeaturePreview preview={feature.preview} />
                </div>
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
