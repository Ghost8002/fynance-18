
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/shared/AuthForm";
import { devLog } from "@/utils/logger";

const Login = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    devLog('Login page - Auth state:', { isAuthenticated, loading });
    if (!loading && isAuthenticated) {
      devLog('User is authenticated, redirecting to dashboard...');
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    devLog('User authenticated on login page, this should redirect...');
    return null; // This should not render as useEffect should redirect
  }

  return <AuthForm />;
};

export default Login;
