import { useState, useEffect } from "react";
import { Menu, LogIn } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/landingpage/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { FynanceLogo } from "@/components/shared/FynanceLogo";

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
        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
      }
    } else if (sectionId === 'cta') {
      const ctaSection = document.querySelector('.button-gradient');
      if (ctaSection) {
        const yOffset = -100;
        const y = ctaSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
      }
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  };
  
  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleGetStarted = () => {
    navigate('/login');
  };
  
  const navItems = [{
    name: "Recursos",
    href: "#features",
    onClick: () => scrollToSection('features')
  }, {
    name: "Preços",
    href: "#pricing",
    onClick: () => scrollToSection('pricing')
  }, {
    name: "Depoimentos",
    href: "#testimonials",
    onClick: () => scrollToSection('testimonials')
  }];
  
  return (
    <header className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 rounded-full ${
      isScrolled 
        ? "h-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 scale-95 w-[92%] max-w-2xl shadow-lg" 
        : "h-14 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-gray-200 dark:border-gray-700 w-[96%] max-w-3xl shadow-md"
    }`}>
      <div className="mx-auto h-full px-4 sm:px-6">
        <nav className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <FynanceLogo size="sm" />
            <span className="font-bold text-base text-gray-900 dark:text-gray-100">Fynance</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {navItems.map(item => (
              <a 
                key={item.name} 
                href={item.href} 
                onClick={e => {
                  e.preventDefault();
                  if (item.onClick) {
                    item.onClick();
                  }
                }} 
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {item.name}
              </a>
            ))}
            
            <ThemeToggle />
            
            <Button onClick={handleGetStarted} size="sm" className="button-gradient ml-2">
              Começar Grátis
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="glass h-9 w-9">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white dark:bg-gray-900 w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map(item => (
                    <a 
                      key={item.name} 
                      href={item.href} 
                      className="text-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" 
                      onClick={e => {
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
                  <div className="mt-4 space-y-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogin();
                      }} 
                      className="w-full"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleGetStarted();
                      }} 
                      className="button-gradient w-full"
                    >
                      Começar Grátis
                    </Button>
                  </div>
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