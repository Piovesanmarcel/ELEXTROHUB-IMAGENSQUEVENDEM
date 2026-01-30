
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import AuthForm from "@/components/auth/AuthForm";

const Login = () => {
  const location = useLocation();

  useEffect(() => {
    // Verificar se veio de um redirect por timeout
    if (location.state?.from && location.state.from.pathname !== '/login') {
      toast.info('Faça login para continuar');
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anúncios Que Vende</h1>
          <p className="text-gray-600">Painel Integrado MercadoLivre</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default Login;
