
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, User } from 'lucide-react';

export default function AuthForm() {
  const navigate = useNavigate();

  const handleAccessAccount = () => {
    navigate('/auth');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500">
          <ShoppingBag className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Bem-vindo ao Anúncios Que Vende</CardTitle>
        <CardDescription>
          Acesse sua conta para gerenciar seus produtos e vendas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleAccessAccount} 
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
          size="lg"
        >
          <User className="mr-2 h-5 w-5" />
          Acesse sua conta
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Faça login para acessar o painel de controle
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
