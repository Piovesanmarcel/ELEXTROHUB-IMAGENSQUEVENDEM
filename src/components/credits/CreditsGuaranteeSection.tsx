
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle } from "lucide-react";

export const CreditsGuaranteeSection = () => {
  return (
    <section className="py-8">
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">Garantia de Satisfação</h3>
          <p className="text-lg text-gray-700 mb-4">
            Não ficou satisfeito com os resultados? Devolvemos seus créditos, sem perguntas.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Processamento seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Suporte 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Resultados imediatos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
