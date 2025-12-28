// Map of routes to their lazy import functions for prefetching
const routeImports: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/transacoes': () => import('@/pages/Transactions'),
  '/transactions': () => import('@/pages/Transactions'),
  '/cartoes': () => import('@/pages/Cards'),
  '/cards': () => import('@/pages/Cards'),
  '/contas': () => import('@/pages/Accounts'),
  '/accounts': () => import('@/pages/Accounts'),
  '/contas-dividas': () => import('@/pages/AccountsAndDebts'),
  '/accounts-debts': () => import('@/pages/AccountsAndDebts'),
  '/orcamentos': () => import('@/pages/Budgets'),
  '/budgets': () => import('@/pages/Budgets'),
  '/metas': () => import('@/pages/Goals'),
  '/goals': () => import('@/pages/Goals'),
  '/relatorios': () => import('@/pages/Reports'),
  '/calendario': () => import('@/pages/Calendar'),
  '/calendar': () => import('@/pages/Calendar'),
  '/assistente-ia': () => import('@/pages/AIAssistant'),
  '/configuracoes': () => import('@/pages/Settings'),
  '/settings': () => import('@/pages/Settings'),
  '/ajuda': () => import('@/pages/Help'),
  '/importacoes': () => import('@/pages/Imports'),
  '/tags': () => import('@/pages/TagsDashboard'),
  '/categories': () => import('@/pages/Categories'),
  '/controle': () => import('@/pages/Control'),
};

// Cache of already prefetched routes
const prefetchedRoutes = new Set<string>();

export function prefetchRoute(path: string): void {
  // Skip if already prefetched or not in the map
  if (prefetchedRoutes.has(path) || !routeImports[path]) {
    return;
  }

  // Mark as prefetched immediately to avoid duplicate calls
  prefetchedRoutes.add(path);

  // Trigger the import
  routeImports[path]().catch(() => {
    // If import fails, remove from cache so it can be retried
    prefetchedRoutes.delete(path);
  });
}

export function prefetchRouteOnHover(path: string): void {
  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => prefetchRoute(path));
  } else {
    setTimeout(() => prefetchRoute(path), 100);
  }
}
