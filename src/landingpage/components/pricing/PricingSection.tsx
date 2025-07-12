
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";

const PricingTier = ({
  name,
  price,
  description,
  features,
  isPopular,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}) => (
  <CardSpotlight className={`h-full ${isPopular ? "border-primary" : "border-gray-200"} border-2 bg-white`}>
    <div className="relative h-full p-6 flex flex-col">
      {isPopular && (
        <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1 w-fit mb-4">
          Mais Popular
        </span>
      )}
      <h3 className="text-xl font-medium mb-2 text-gray-900">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        {price !== "Personalizado" && <span className="text-gray-500">/mês</span>}
      </div>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="button-gradient w-full">
        Começar Agora
      </Button>
    </div>
  </CardSpotlight>
);

export const PricingSection = () => {
  return (
    <section className="container px-4 py-24 bg-white">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl font-normal mb-6 text-gray-900"
        >
          Escolha Seu{" "}
          <span className="text-gradient font-medium">Plano Ideal</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-lg text-gray-600"
        >
          Selecione o plano perfeito com recursos avançados e preços competitivos
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingTier
          name="Pessoal"
          price="R$ 0"
          description="Perfeito para quem está começando a organizar as finanças"
          features={[
            "Controle básico de gastos",
            "Categorização automática",
            "Relatórios mensais",
            "Suporte por email"
          ]}
        />
        <PricingTier
          name="Premium"
          price="R$ 29"
          description="Recursos avançados para gestão financeira completa"
          features={[
            "Todos os recursos básicos",
            "Planejamento financeiro",
            "Análise de investimentos",
            "Suporte prioritário",
            "Integração bancária",
            "Relatórios personalizados"
          ]}
          isPopular
        />
        <PricingTier
          name="Empresarial"
          price="Personalizado"
          description="Soluções sob medida para empresas e gestores"
          features={[
            "Gestão financeira empresarial",
            "Controle de fluxo de caixa",
            "Dashboard executivo",
            "Gestor de conta dedicado",
            "Integração com ERP",
            "Suporte 24/7 prioritário"
          ]}
        />
      </div>
    </section>
  );
};
