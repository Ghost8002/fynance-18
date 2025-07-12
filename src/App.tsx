
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Cards from "./pages/Cards";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import AccountsAndDebts from "./pages/AccountsAndDebts";
import TagsDashboard from "./pages/TagsDashboard";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import AIAssistantPage from "./pages/AIAssistant";
import Reports from "./pages/Reports";
import Help from "./pages/Help";
import LandingPage from "@/landingpage/LandingPage";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Dashboard /> : <LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Rotas em português para corresponder à sidebar */}
      <Route path="/transacoes" element={<Transactions />} />
      <Route path="/contas-dividas" element={<AccountsAndDebts />} />
      <Route path="/cartoes" element={<Cards />} />
      <Route path="/contas" element={<Accounts />} />
      <Route path="/orcamentos" element={<Budgets />} />
      <Route path="/metas" element={<Goals />} />
      <Route path="/relatorios" element={<Reports />} />
      <Route path="/calendario" element={<Calendar />} />
      <Route path="/assistente-ia" element={<AIAssistantPage />} />
      <Route path="/configuracoes" element={<Settings />} />
      <Route path="/ajuda" element={<Help />} />
      {/* Manter rotas antigas em inglês para compatibilidade */}
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/cards" element={<Cards />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/budgets" element={<Budgets />} />
      <Route path="/goals" element={<Goals />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/accounts-debts" element={<AccountsAndDebts />} />
      <Route path="/tags" element={<TagsDashboard />} />
      <Route path="/calendar" element={<Calendar />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
