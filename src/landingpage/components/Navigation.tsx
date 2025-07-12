
import { useState, useEffect } from "react";
import { Command, Menu, LogIn } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/landingpage/components/ui/sheet";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'testimonials') {
      const testimonialSection = document.querySelector('.animate-marquee');
      if (testimonialSection) {
        const yOffset = -100;
        const y = testimonialSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else if (sectionId === 'cta') {
      const ctaSection = document.querySelector('.button-gradient');
      if (ctaSection) {
        const yOffset = -100;
        const y = ctaSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  const navItems = [
    { name: "Recursos", href: "#features", onClick: () => scrollToSection('features') },
    { name: "Preços", href: "#pricing", onClick: () => scrollToSection('pricing') },
    { name: "Depoimentos", href: "#testimonials", onClick: () => scrollToSection('testimonials') },
  ];

  return (
    <header
      className={`fixed top-3.5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 rounded-full ${
        isScrolled 
          ? "h-14 bg-white/80 backdrop-blur-xl border border-gray-200 scale-95 w-[90%] max-w-2xl shadow-lg" 
          : "h-14 bg-white/90 backdrop-blur-lg border border-gray-200 w-[95%] max-w-3xl shadow-md"
      }`}
    >
      <div className="mx-auto h-full px-6">
        <nav className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-gray-900">Fynance</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.onClick) {
                    item.onClick();
                  }
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-all duration-300"
              >
                {item.name}
              </a>
            ))}
            <Button 
              size="sm"
              variant="outline"
              onClick={handleLogin}
              className="mr-2"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Entrar
            </Button>
            <Button 
              onClick={handleGetStarted}
              size="sm"
              className="button-gradient"
            >
              Começar Grátis
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="glass">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white">
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-lg text-gray-600 hover:text-gray-900 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        if (item.onClick) {
                          item.onClick();
                        }
                      }}
                    >
                      {item.name}
                    </a>
                  ))}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogin();
                    }}
                    className="mt-4"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleGetStarted();
                    }}
                    className="button-gradient"
                  >
                    Começar Grátis
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
