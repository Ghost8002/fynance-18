import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, BarChart3, PiggyBank, Target, Shield } from "lucide-react";
import ThemeToggle from "@/components/shared/ThemeToggle";
const Index = () => {
  const {
    isAuthenticated
  } = useAuth();

  // Features list
  const features = [{
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    title: "Visão Completa das Finanças",
    description: "Acompanhe receitas, despesas, investimentos e dívidas em um só lugar com gráficos e relatórios intuitivos."
  }, {
    icon: <PiggyBank className="h-6 w-6 text-primary" />,
    title: "Orçamento Inteligente",
    description: "Defina limites de gastos por categoria e receba alertas quando estiver próximo de ultrapassá-los."
  }, {
    icon: <Target className="h-6 w-6 text-primary" />,
    title: "Metas Financeiras",
    description: "Estabeleça metas de economia, investimento ou quitação de dívidas e acompanhe seu progresso."
  }, {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: "100% Seguro e Privado",
    description: "Seus dados financeiros são criptografados e nunca compartilhados com terceiros."
  }];
  return <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
              <path d="M12 1v22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="text-xl font-bold text-primary">Fynance</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/recursos" className="text-muted-foreground hover:text-primary transition-colors">
              Recursos
            </Link>
            <Link to="/precos" className="text-muted-foreground hover:text-primary transition-colors">
              Preços
            </Link>
            <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
              Blog
            </Link>
            <Link to="/suporte" className="text-muted-foreground hover:text-primary transition-colors">
              Suporte
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? <Link to="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Meu Dashboard
                </Button>
              </Link> : <Link to="/login">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Entrar
                </Button>
              </Link>}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-background to-accent">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Controle suas finanças. Conquiste seus sonhos.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Gerencie seu dinheiro de forma simples e inteligente com o aplicativo 
              financeiro mais completo do Brasil.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/login">
                <Button className="w-full sm:w-auto text-primary-foreground bg-primary hover:bg-primary/90 px-8 py-2 rounded-md flex items-center justify-center">
                  Comece grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/recursos">
                <Button variant="outline" className="w-full sm:w-auto">
                  Conhecer recursos
                </Button>
              </Link>
            </div>
          </div>

          {/* Authentication Form or Dashboard Link */}
          <div className="md:w-1/2 md:pl-10">
            {isAuthenticated ? <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
                <h2 className="text-2xl font-bold mb-4 text-card-foreground">Bem-vindo de volta!</h2>
                <p className="text-muted-foreground mb-6">
                  Continue gerenciando suas finanças e atingindo seus objetivos.
                </p>
                <Link to="/dashboard">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Ir para o Dashboard
                  </Button>
                </Link>
              </div> : <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
                <AuthForm />
              </div>}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Recursos que transformam sua vida financeira</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experimente ferramentas poderosas para tomar o controle do seu dinheiro
              e tomar decisões financeiras mais inteligentes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => <div key={index} className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
                <div className="p-3 bg-accent rounded-full w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-accent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">O que nossos usuários dizem</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Milhares de pessoas já transformaram sua relação com o dinheiro usando nossa plataforma
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                    <span className="font-bold text-muted-foreground">
                      {["MM", "JD", "PS"][i - 1]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">
                      {["Marcos Martins", "Juliana Dantas", "Pedro Silva"][i - 1]}
                    </p>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>)}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {["Depois que comecei a usar o Fynance, finalmente consegui organizar meu orçamento e economizar para minha viagem dos sonhos.", "O aplicativo me ajudou a identificar gastos desnecessários que eu nem percebia que estava fazendo. Já economizei mais de R$ 500 por mês!", "Sou péssimo com números, mas o Fynance tornou o controle financeiro tão simples que até eu consegui organizar minhas contas."][i - 1]}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-6">
            Comece hoje a transformar sua vida financeira
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já estão economizando mais, 
            gastando melhor e realizando seus sonhos financeiros.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/login">
              <Button className="w-full sm:w-auto bg-card text-card-foreground hover:bg-card/90 px-8 py-2">
                Criar conta grátis
              </Button>
            </Link>
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                  <path d="M12 1v22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span className="text-xl font-bold text-foreground">Fynance</span>
              </Link>
              <p className="mb-4">
                Sua plataforma completa para gestão financeira pessoal.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Produto</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/recursos" className="hover:text-foreground transition-colors">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link to="/precos" className="hover:text-foreground transition-colors">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Cadastre-se
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/sobre" className="hover:text-foreground transition-colors">
                    Sobre nós
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/carreiras" className="hover:text-foreground transition-colors">
                    Carreiras
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/contato" className="hover:text-foreground transition-colors">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link to="/ajuda" className="hover:text-foreground transition-colors">
                    Central de ajuda
                  </Link>
                </li>
                <li>
                  <Link to="/privacidade" className="hover:text-foreground transition-colors">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p>© 2025 Fynance. Todos os direitos reservados.</p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a href="#" aria-label="Facebook" className="hover:text-foreground">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-foreground">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.059 10.059 0 01-3.126 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-foreground">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.92 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.92 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.92-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.92-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;