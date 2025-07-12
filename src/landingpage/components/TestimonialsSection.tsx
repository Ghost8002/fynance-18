
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Empreendedora",
    content: "O Fynance transformou completamente a forma como gerencio minhas finanças. A interface é intuitiva e os relatórios são muito detalhados.",
    rating: 5,
    avatar: "/landingpage/lovable-uploads/79f2b901-8a4e-42a5-939f-fae0828e0aef.png"
  },
  {
    name: "João Santos",
    role: "Freelancer",
    content: "Finalmente encontrei uma ferramenta que me ajuda a controlar meus gastos e planejar meu futuro financeiro. Recomendo muito!",
    rating: 5,
    avatar: "/landingpage/lovable-uploads/86329743-ee49-4f2e-96f7-50508436273d.png"
  },
  {
    name: "Ana Costa",
    role: "Consultora",
    content: "A análise de investimentos do Fynance é excepcional. Consegui diversificar minha carteira e aumentar meus rendimentos.",
    rating: 5,
    avatar: "/landingpage/lovable-uploads/b6436838-5c1a-419a-9cdc-1f9867df073d.png"
  },
  {
    name: "Pedro Lima",
    role: "Empresário",
    content: "O dashboard executivo me dá uma visão completa do meu negócio. Indispensável para quem quer crescer de forma sustentável.",
    rating: 5,
    avatar: "/landingpage/lovable-uploads/a2c0bb3a-a47b-40bf-ba26-d79f2f9e741b.png"
  },
  {
    name: "Carla Mendes",
    role: "Gerente",
    content: "O controle de fluxo de caixa é perfeito. Consigo prever cenários e tomar decisões mais assertivas para minha empresa.",
    rating: 5,
    avatar: "/landingpage/lovable-uploads/e143cef1-4ad0-404b-b47a-147e89bc017c.png"
  },
  {
    name: "Roberto Alves",
    role: "Investidor",
    content: "A integração bancária facilita muito minha vida. Tudo sincronizado automaticamente, sem perder tempo com planilhas.",
    rating: 5,
    avatar: "/landingpage/lovable-uploads/7335619d-58a9-41ad-a233-f7826f56f3e9.png"
  }
];

const TestimonialsSection = () => {
  const extendedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-20 bg-gray-50 overflow-hidden">
      <div className="container px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-5xl md:text-6xl font-normal mb-6 text-gray-900">
            O que nossos{" "}
            <span className="text-gradient font-medium">clientes dizem</span>
          </h2>
          <p className="text-lg text-gray-600">
            Milhares de pessoas já transformaram suas finanças com o Fynance
          </p>
        </motion.div>
      </div>

      <div className="relative">
        <motion.div
          className="flex gap-6 animate-marquee"
          style={{
            width: "fit-content",
          }}
        >
          {extendedTestimonials.map((testimonial, index) => (
            <motion.div
              key={`testimonial-${index}`}
              className="glass glass-hover rounded-xl p-6 min-w-[350px] bg-white border border-gray-200 hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{testimonial.name}</h4>
                  <p className="text-gray-600 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
