
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { FinancialProvider } from "@/context/FinancialContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AccountsAndDebts from "./pages/AccountsAndDebts";
import Cards from "./pages/Cards";
import Accounts from "./pages/Accounts";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import AIAssistantPage from "./pages/AIAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <FinancialProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transacoes" element={<Transactions />} />
              <Route path="/contas-dividas" element={<AccountsAndDebts />} />
              <Route path="/pagamentos-receber" element={<Navigate to="/contas-dividas" replace />} />
              <Route path="/cartoes" element={<Cards />} />
              <Route path="/contas" element={<Accounts />} />
              <Route path="/orcamentos" element={<Budgets />} />
              <Route path="/metas" element={<Goals />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/calendario" element={<Calendar />} />
              <Route path="/assistente-ia" element={<AIAssistantPage />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/ajuda" element={<Help />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FinancialProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
