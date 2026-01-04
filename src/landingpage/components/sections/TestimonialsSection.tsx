import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Mariana Costa",
    role: "Empreendedora",
    avatar: "MC",
    rating: 5,
    text: "Finalmente consegui organizar minhas finanças pessoais e da empresa em um só lugar. O Fynance mudou minha relação com dinheiro!",
  },
  {
    name: "Rafael Souza",
    role: "Desenvolvedor",
    avatar: "RS",
    rating: 5,
    text: "A interface é linda e intuitiva. Não preciso ser expert em finanças para entender meus gastos. Recomendo demais!",
  },
  {
    name: "Ana Paula Lima",
    role: "Designer",
    avatar: "AL",
    rating: 5,
    text: "Os gráficos e relatórios são incríveis. Consigo ver exatamente onde posso economizar. Já guardei R$ 3.000 em 3 meses!",
  },
  {
    name: "Carlos Eduardo",
    role: "Médico",
    avatar: "CE",
    rating: 5,
    text: "Com a rotina corrida, precisava de algo simples e eficiente. O Fynance é perfeito: cadastro rápido e controle total.",
  },
  {
    name: "Juliana Mendes",
    role: "Advogada",
    avatar: "JM",
    rating: 5,
    text: "A funcionalidade de contas a pagar e receber salvou minha organização. Nunca mais perdi um prazo de pagamento.",
  },
  {
    name: "Bruno Ferreira",
    role: "Professor",
    avatar: "BF",
    rating: 5,
    text: "Uso o Fynance há 6 meses e minha reserva de emergência saiu do zero. A IA realmente ajuda a identificar onde cortar gastos.",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-muted/30 overflow-hidden">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-finance-purple/10 text-finance-purple text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Depoimentos
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Milhares de pessoas já transformaram sua vida financeira com o Fynance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
              
              {/* Rating */}
              <div className="flex items-center gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Text */}
              <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
