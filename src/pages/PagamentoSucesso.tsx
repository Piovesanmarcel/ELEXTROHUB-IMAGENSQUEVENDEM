import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

// Detectar modo de teste de forma inteligente
const detectTestMode = () => {
  if (import.meta.env.DEV) return true;
  if (typeof window !== 'undefined' && window.location.hostname.includes('preview')) return true;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test_mode') === 'true') return true;
  }
  return false;
};

const PagamentoSucesso = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already_processed">("loading");
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  
  const isTestMode = detectTestMode();

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setStatus("error");
        setErrorMessage("Session ID não encontrado");
        return;
      }

      try {
        // Força refresh do token para garantir JWT válido
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        // Usar isTestMode do escopo do componente
        const headers: Record<string, string> = {};
        
        if (isTestMode) {
          headers["x-stripe-test-mode"] = "true";
          console.log("[PagamentoSucesso] 🧪 Modo TESTE ativo - usando chave de teste do Stripe");
        }

        const { data, error } = await supabase.functions.invoke("verify-credits-payment", {
          body: { sessionId },
          headers,
        });

        if (error) {
          if (error.name === "FunctionsHttpError" && (error as any).context) {
            const res = (error as any).context as Response;
            const text = await res.text().catch(() => "");
            throw new Error(text || `Erro HTTP ${res.status} ao verificar pagamento`);
          }
          throw new Error(error.message);
        }

        if (data.success) {
          setCreditsAdded(data.credits_added);
          setTotalAvailable(data.total_available || data.credits_added);
          setStatus(data.already_processed ? "already_processed" : "success");
        } else {
          setStatus("error");
          setErrorMessage(data.message || "Pagamento não confirmado");
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Erro ao verificar pagamento");
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <CardTitle>Verificando Pagamento</CardTitle>
              <CardDescription>Aguarde enquanto confirmamos seu pagamento...</CardDescription>
            </>
          )}
          
          {(status === "success" || status === "already_processed") && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-green-600">Pagamento Confirmado!</CardTitle>
              <CardDescription>
                {status === "already_processed" 
                  ? "Seus créditos já foram adicionados anteriormente"
                  : "Seus créditos foram adicionados com sucesso"
                }
              </CardDescription>
            </>
          )}
          
          {status === "error" && (
            <>
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-destructive">Erro no Pagamento</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {(status === "success" || status === "already_processed") && (
            <div className="bg-muted rounded-lg p-6 space-y-2">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                <CreditCard className="h-6 w-6" />
                +{creditsAdded} créditos
              </div>
              {totalAvailable > 0 && (
                <p className="text-sm text-muted-foreground">
                  Saldo total: {totalAvailable} créditos disponíveis
                </p>
              )}
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/melhoria-imagens">Usar Meus Créditos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/comprar-creditos">Comprar Mais Créditos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PagamentoSucesso;
