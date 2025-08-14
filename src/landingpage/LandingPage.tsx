import { motion } from "framer-motion";
import { ArrowRight, Command } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import Navigation from "@/landingpage/components/Navigation";
import { FeaturesSection } from "@/landingpage/components/features/FeaturesSection";
import { PricingSection } from "@/landingpage/components/pricing/PricingSection";
import TestimonialsSection from "@/landingpage/components/TestimonialsSection";
import Footer from "@/landingpage/components/Footer";
import { SectionSpotlight } from "@/landingpage/components/ui/SectionSpotlight";
import { TextGenerateEffect } from "@/landingpage/components/ui/text-generate-effect";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleViewFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-foreground overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:pb-20">
        {/* Background */}
        <div 
          className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900"
        />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-block mb-6 px-4 py-2 rounded-full glass"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <Command className="w-4 h-4 inline-block mr-2 text-primary" />
            Sistema completo de gestão financeira
          </span>
        </motion.div>
        
        <div className="max-w-4xl relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal mb-6 tracking-tight text-left">
            <span className="text-gray-800 dark:text-gray-200">
              <TextGenerateEffect words="Gerencie suas finanças com" />
            </span>
            <br />
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              <TextGenerateEffect words="inteligência & controle" />
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl text-left"
          >
            Tenha controle total sobre suas finanças pessoais e empresariais com análises avançadas, planejamento inteligente e segurança de nível bancário.{" "}
            <span className="text-gray-900 dark:text-gray-100 font-medium">Comece agora mesmo.</span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 items-start"
          >
            <Button size="lg" className="button-gradient w-full sm:w-auto" onClick={handleGetStarted}>
              Comece Grátis
            </Button>
            <Button size="lg" variant="link" className="text-primary hover:text-blue-700 w-full sm:w-auto justify-center sm:justify-start" onClick={handleViewFeatures}>
              Ver Funcionalidades <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <SectionSpotlight intensity={0.06}>
        <div id="features" className="bg-gray-50 dark:bg-gray-800">
          <FeaturesSection />
        </div>
      </SectionSpotlight>

      {/* Pricing Section */}
      <SectionSpotlight intensity={0.08}>
        <div id="pricing" className="bg-white dark:bg-gray-900">
          <PricingSection />
        </div>
      </SectionSpotlight>

      {/* Testimonials Section */}
      <SectionSpotlight intensity={0.05}>
        <div className="bg-gray-50 dark:bg-gray-800">
          <TestimonialsSection />
        </div>
      </SectionSpotlight>

      {/* CTA Section */}
      <SectionSpotlight intensity={0.1}>
        <section className="container mx-auto px-4 py-16 sm:py-20 relative bg-white dark:bg-gray-900">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url("/landingpage/lovable-uploads/21f3edfb-62b5-4e35-9d03-7339d803b980.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 md:p-12 text-center relative z-10 shadow-xl max-w-4xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Pronto para transformar suas finanças?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de usuários que já descobriram o poder da gestão financeira inteligente.
            </p>
            <Button size="lg" className="button-gradient w-full sm:w-auto" onClick={handleGetStarted}>
              Criar Conta Gratuita
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </section>
      </SectionSpotlight>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-800">
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage; 