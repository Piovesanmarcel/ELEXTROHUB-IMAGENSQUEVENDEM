import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Lock, Loader2 } from 'lucide-react';

const RedefinirSenha = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Setar flag no localStorage para bloquear acesso ao painel
    try {
      localStorage.setItem('pending_password_reset', '1');
      console.log('🔒 RedefinirSenha - Flag pending_password_reset setado');
    } catch (e) {
      console.error('Erro ao setar localStorage:', e);
    }

    // Escutar evento PASSWORD_RECOVERY do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('RedefinirSenha - Auth event:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 PASSWORD_RECOVERY event detectado');
        setIsReady(true);
      }
    });

    // Verificar se já tem sessão (link pode ter sido processado)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('✅ Sessão encontrada, pronto para redefinir senha');
        setIsReady(true);
      }
    };
    
    // Aguardar um pouco para o Supabase processar o link
    setTimeout(checkSession, 1000);

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        if (error.message?.toLowerCase().includes('new password should be different')) {
          toast.error('A nova senha precisa ser diferente da senha atual.');
        } else {
          toast.error(error.message);
        }
      } else {
        // ✅ Limpar flag e fazer logout
        try {
          localStorage.removeItem('pending_password_reset');
          console.log('🔓 Flag pending_password_reset removido');
        } catch (e) {
          console.error('Erro ao remover localStorage:', e);
        }

        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch {
          await supabase.auth.signOut();
        }

        toast.success('Senha redefinida com sucesso! Faça login com sua nova senha.');
        
        // Redirecionar para login
        navigate('/auth', { replace: true });
      }
    } catch (error) {
      toast.error('Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Anúncios Que Vende</h1>
              <p className="text-sm text-gray-600">Analytics e Gestão</p>
            </div>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
            <CardDescription>
              {isReady ? 'Digite sua nova senha abaixo' : 'Processando link de recuperação...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isReady ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Digite sua nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirme sua nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-600">Aguarde...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RedefinirSenha;
