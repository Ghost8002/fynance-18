import Navigation from "@/landingpage/components/Navigation";
import Footer from "@/landingpage/components/Footer";
import { SectionSpotlight } from "@/landingpage/components/ui/SectionSpotlight";
import { HeroSection } from "@/landingpage/components/sections/HeroSection";
import { BenefitsSection } from "@/landingpage/components/sections/BenefitsSection";
import { HowItWorksSection } from "@/landingpage/components/sections/HowItWorksSection";
import { FeaturesGrid } from "@/landingpage/components/sections/FeaturesGrid";
import { TestimonialsSection } from "@/landingpage/components/sections/TestimonialsSection";
import { SecuritySection } from "@/landingpage/components/sections/SecuritySection";
import { PricingSection } from "@/landingpage/components/pricing/PricingSection";
import { FAQSection } from "@/landingpage/components/sections/FAQSection";
import { FinalCTASection } from "@/landingpage/components/sections/FinalCTASection";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section */}
      <SectionSpotlight intensity={0.05}>
        <HeroSection />
      </SectionSpotlight>

      {/* Benefits Section */}
      <BenefitsSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Features Section */}
      <SectionSpotlight intensity={0.06}>
        <FeaturesGrid />
      </SectionSpotlight>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Security Section */}
      <SecuritySection />

      {/* Pricing Section */}
      <SectionSpotlight intensity={0.08}>
        <PricingSection />
      </SectionSpotlight>

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <SectionSpotlight intensity={0.1}>
        <FinalCTASection />
      </SectionSpotlight>

      {/* Footer */}
      <div className="bg-muted/30">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
