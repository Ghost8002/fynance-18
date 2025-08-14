
import { Github, Twitter } from "lucide-react";
import { Button } from "@/landingpage/components/ui/button";

const Footer = () => {
  return (
    <footer className="w-full py-12 mt-20">
      <div className="container px-4">
        <div className="glass glass-hover rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">Fynance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Transformando sua gestão financeira com inteligência e simplicidade.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 hover:text-primary">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 hover:text-primary">
                  <Github className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Gestão</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                    Controle Financeiro
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                    Planos e Preços
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Recursos</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                    Guia Financeiro
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                    Análise de Investimentos
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                    Termos de Uso
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
              © {new Date().getFullYear()} Fynance. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
