import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const AssinaturaSucesso = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription } = useSubscription();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh subscription status after successful payment
    checkSubscription();
  }, [checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Assinatura Ativada!</CardTitle>
          <CardDescription>
            Sua assinatura foi processada com sucesso. Agora você tem acesso completo à plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              Você receberá um email de confirmação com os detalhes da sua assinatura.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/')} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Ir para o Início
            </Button>
            <Button variant="outline" onClick={() => navigate('/comprar-creditos')} className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Comprar Créditos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssinaturaSucesso;
