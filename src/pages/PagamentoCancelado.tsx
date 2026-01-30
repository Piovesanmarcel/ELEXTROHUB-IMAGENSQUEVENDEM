import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PagamentoCancelado = () => {
  return (
    <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <CardTitle>Pagamento Cancelado</CardTitle>
          <CardDescription>
            Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Se você teve algum problema ou dúvida, entre em contato com nosso suporte.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/comprar-creditos">
                <CreditCard className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/painel">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Painel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PagamentoCancelado;
