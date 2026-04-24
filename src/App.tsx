import React, { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { RealtimeDataProvider } from "@/context/RealtimeDataContext";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/shared/AppLayout";
import { ContentSkeleton } from "@/components/skeletons/ContentSkeleton";
import { usePWAStandalone } from "@/hooks/useMobileDetect";
import { OfflineBanner } from "@/components/shared/OfflineBanner";


// Eager loaded pages (critical path)
import LandingPage from "@/landingpage/LandingPage";
import Login from "./pages/Login";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Pricing from "./pages/Pricing";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCanceled from "./pages/CheckoutCanceled";
import ResetPassword from "./pages/ResetPassword";

// Lazy loaded pages (code splitting)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Cards = lazy(() => import("./pages/Cards"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Categories = lazy(() => import("./pages/Categories"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Goals = lazy(() => import("./pages/Goals"));
const Settings = lazy(() => import("./pages/Settings"));
const AccountsAndDebts = lazy(() => import("./pages/AccountsAndDebts"));
const TagsDashboard = lazy(() => import("./pages/TagsDashboard"));
const Calendar = lazy(() => import("./pages/Calendar"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistant"));
const Reports = lazy(() => import("./pages/Reports"));
const Help = lazy(() => import("./pages/Help"));
const Control = lazy(() => import("./pages/Control"));
const Imports = lazy(() => import("./pages/Imports"));
const ImportsTransactions = lazy(() => import("./pages/ImportsTransactions"));
const ImportsXLSX = lazy(() => import("./pages/ImportsXLSX"));
const ImportsJSON = lazy(() => import("./pages/ImportsJSON"));
const BankSelectorDemo = lazy(() => import("./pages/BankSelectorDemo"));
const UploadBankLogos = lazy(() => import("./pages/UploadBankLogos"));
const Subcategories = lazy(() => import("./pages/Subcategories"));
const SubcategoryTest = lazy(() => import("./components/categories/SubcategoryTest"));
const TestSubcategoryCreation = lazy(() => import("./components/categories/TestSubcategoryCreation"));
const CostCenterAnalysis = lazy(() => import("./pages/CostCenterAnalysis"));
const Investments = lazy(() => import("./pages/Investments"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback that shows skeleton inside layout for authenticated routes
const PageLoader = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // If authenticated or checking auth, show skeleton in layout
  if (isAuthenticated || loading) {
    return (
      <AppLayout>
        <ContentSkeleton variant="dashboard" />
      </AppLayout>
    );
  }
  
  // For public routes, just return null (they load fast)
  return null;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const isStandalone = usePWAStandalone();
  
  // When app is installed (standalone mode), show AI Assistant as home for authenticated users
  const getHomeElement = () => {
    if (!isAuthenticated) return <LandingPage />;
    if (isStandalone) return <AIAssistantPage />;
    return <Dashboard />;
  };
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={getHomeElement()} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/termos" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/precos" element={<Pricing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout-success" element={<CheckoutSuccess />} />
        <Route path="/checkout-canceled" element={<CheckoutCanceled />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected routes - Portuguese */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/transacoes" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/contas-dividas" element={<ProtectedRoute><AccountsAndDebts /></ProtectedRoute>} />
        <Route path="/cartoes" element={<ProtectedRoute><Cards /></ProtectedRoute>} />
        <Route path="/contas" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
        <Route path="/controle" element={<ProtectedRoute><Control /></ProtectedRoute>} />
        <Route path="/orcamentos" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
        <Route path="/metas" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/investimentos" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/calendario" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/assistente-ia" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/ajuda" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="/importacoes" element={<ProtectedRoute><Imports /></ProtectedRoute>} />
        <Route path="/importacoes/transacoes" element={<ProtectedRoute><ImportsTransactions /></ProtectedRoute>} />
        <Route path="/importacoes/xlsx" element={<ProtectedRoute><ImportsXLSX /></ProtectedRoute>} />
        <Route path="/importacoes/json" element={<ProtectedRoute><ImportsJSON /></ProtectedRoute>} />
        <Route path="/demo-bancos" element={<ProtectedRoute><BankSelectorDemo /></ProtectedRoute>} />
        <Route path="/upload-logos" element={<ProtectedRoute><UploadBankLogos /></ProtectedRoute>} />
        <Route path="/centro-custo/:categoryId" element={<ProtectedRoute><CostCenterAnalysis /></ProtectedRoute>} />
        
        {/* Protected routes - English (compatibility) */}
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/cards" element={<ProtectedRoute><Cards /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/subcategories" element={<ProtectedRoute><Subcategories /></ProtectedRoute>} />
        <Route path="/subcategory-test" element={<ProtectedRoute><SubcategoryTest /></ProtectedRoute>} />
        <Route path="/test-subcategory-creation" element={<ProtectedRoute><TestSubcategoryCreation /></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/accounts-debts" element={<ProtectedRoute><AccountsAndDebts /></ProtectedRoute>} />
        <Route path="/tags" element={<ProtectedRoute><TagsDashboard /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'system';
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (stored === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(stored);
    }
  }, []);

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <RealtimeDataProvider>
              <ThemeProvider>
                <TooltipProvider>
                  <OfflineBanner />
                  <Toaster />
                  <Sonner />
                  <AppRoutes />
                </TooltipProvider>
              </ThemeProvider>
            </RealtimeDataProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
