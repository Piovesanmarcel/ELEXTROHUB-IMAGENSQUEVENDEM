import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Mail, Lock, User, Check, Sparkles, Loader2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 69.90,
    priceLabel: 'R$ 69,90/mês',
    features: ['Acesso completo', 'Cancele quando quiser'],
  },
  {
    id: 'yearly',
    name: 'Anual',
    price: 358.80,
    priceLabel: 'R$ 29,90/mês',
    originalPrice: 'R$ 69,90/mês',
    savings: '57% OFF',
    features: ['Economia de 57%', 'Suporte prioritário'],
    isPopular: true,
  },
];

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('Digite seu email primeiro');
      return;
    }

    setIsLoading(true);
    try {
      // Usar edge function personalizada para email em português
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: formData.email.trim(),
          redirectUrl: `${window.location.origin}/redefinir-senha`,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Erro ao enviar email');
      } else {
        toast.success('Email de redefinição enviado! Verifique sua caixa de entrada.');
        setShowForgotPassword(false);
      }
    } catch (error) {
      toast.error('Erro ao enviar email de redefinição');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    const checkExistingSession = async () => {
      // Se há reset pendente, não redirecionar (deixar RequireAuth tratar)
      try {
        if (localStorage.getItem('pending_password_reset') === '1') {
          console.log('🔒 Reset pendente detectado - não redirecionar');
          return;
        }
      } catch {}

      const urlParams = new URLSearchParams(window.location.search);

      // Se acabamos de sair do reset, sempre manter na tela de login
      if (urlParams.get('relogin') === '1') {
        console.log('🔒 Parâmetro relogin=1 detectado - mantendo na tela de login');
        window.history.replaceState({}, '', '/auth');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('✅ Usuário já autenticado, redirecionando para /painel');
        navigate('/painel', { replace: true });
      }
    };
    checkExistingSession();
  }, [navigate]);

  const confirmSession = async (retries = 3, delay = 500): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log(`✅ Sessão confirmada (tentativa ${i + 1}/${retries})`);
        return true;
      }
      if (i < retries - 1) {
        console.log(`⏳ Aguardando sessão (tentativa ${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({
      email: formData.email,
      password: formData.password
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    // Limpar qualquer flag de recovery antes do login
    try {
      localStorage.removeItem('pending_password_reset');
    } catch {}

    setIsLoading(true);
    const startTime = Date.now();

    try {
      console.log('🔐 Iniciando login...');
      
      const loginPromise = supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 12000)
      );

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Erro no login:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          toast.error(error.message || 'Erro ao fazer login');
        }
        return;
      }

      if (data?.user) {
        const duration = Date.now() - startTime;
        console.log(`✅ Login realizado (${duration}ms)`);
        
        const sessionConfirmed = await confirmSession(3, 500);
        
        if (sessionConfirmed) {
          console.log('✅ Sessão confirmada, redirecionando...');
          toast.success('Login realizado com sucesso!');
          navigate('/painel', { replace: true });
        } else {
          console.warn('⚠️ Sessão não confirmada, usando fallback');
          toast.success('Login realizado com sucesso!');
          window.location.replace('/painel');
        }
      } else {
        toast.error('Erro inesperado no login');
      }
    } catch (error: any) {
      console.error('❌ Erro inesperado no login:', error);
      
      if (error?.message === 'TIMEOUT') {
        toast.error('Problema de rede. Verifique sua conexão e tente novamente.');
      } else {
        toast.error('Erro de conexão. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Tentando criar conta com plano:', selectedPlan);
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim(),
            selected_plan: selectedPlan,
          },
          emailRedirectTo: `${window.location.origin}/assinatura-sucesso`
        }
      });

      if (error) {
        console.error('Erro no cadastro:', error);
        
        if (error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
        } else {
          toast.error(error.message || 'Erro ao criar conta');
        }
        return;
      }

      if (data?.user) {
        console.log('Conta criada com sucesso, redirecionando para pagamento...');
        toast.success('Conta criada! Redirecionando para pagamento...');
        
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-subscription-checkout', {
            body: { planType: selectedPlan },
          });

          if (checkoutError || checkoutData?.error) {
            console.error('Erro ao criar checkout:', checkoutError || checkoutData?.error);
            toast.error('Erro ao iniciar pagamento. Faça login e tente novamente em /planos');
            setActiveTab('login');
            return;
          }

          if (checkoutData?.url) {
            window.location.href = checkoutData.url;
            return;
          }
        } else {
          toast.info('Confirme seu email e faça login para prosseguir com o pagamento.');
          setActiveTab('login');
          setFormData({ email: '', password: '', name: '' });
        }
      }
    } catch (error) {
      console.error('Erro inesperado no cadastro:', error);
      toast.error('Erro de conexão. Tente novamente.');
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
            <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
            <CardDescription>
              Entre ou crie uma conta para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="Sua senha"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  
                  {showForgotPassword && (
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Digite seu email acima e clique no botão abaixo para receber um link de redefinição.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleForgotPassword}
                        disabled={isLoading || !formData.email}
                        className="w-full"
                      >
                        {isLoading ? 'Enviando...' : 'Enviar link de redefinição'}
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Fazer Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10"
                        minLength={6}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Plan Selection */}
                  <div className="space-y-3 pt-2">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      Escolha seu plano
                    </Label>
                    <RadioGroup 
                      value={selectedPlan} 
                      onValueChange={setSelectedPlan}
                      className="grid grid-cols-2 gap-3"
                    >
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <div key={plan.id} className="relative">
                          <RadioGroupItem
                            value={plan.id}
                            id={plan.id}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={plan.id}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                              ${selectedPlan === plan.id 
                                ? 'border-purple-600 bg-purple-50' 
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            {plan.isPopular && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                {plan.savings}
                              </span>
                            )}
                            <span className="font-semibold text-gray-900">{plan.name}</span>
                            <span className="text-sm font-bold text-purple-600">{plan.priceLabel}</span>
                            {plan.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">{plan.originalPrice}</span>
                            )}
                            {selectedPlan === plan.id && (
                              <Check className="absolute top-2 right-2 h-4 w-4 text-purple-600" />
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground text-center">
                      Você receberá 10 créditos grátis para começar!
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Criar Conta e Pagar'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
