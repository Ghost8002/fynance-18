
import { useSupabaseAuth } from './useSupabaseAuth';

export const useAuth = () => {
  const auth = useSupabaseAuth();
  
  return {
    ...auth,
    isAuthenticated: !!auth.user,
    logout: auth.signOut,
  };
};

// Re-export AuthProvider from the correct location
export { AuthProvider } from './useAuth.tsx';
