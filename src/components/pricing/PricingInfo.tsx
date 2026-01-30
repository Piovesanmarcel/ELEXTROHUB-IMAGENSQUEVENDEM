
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PricingInfo = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Política de Comissões - Shopee</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Comissões Aplicadas:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Comissão padrão: 14% sobre o preço de venda</li>
              <li>• Programa Frete Grátis: +6% (opcional)</li>
              <li>• Taxa por item: R$ 4,00 por produto vendido</li>
              <li>• Impostos: Conforme sua configuração fiscal</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Como Usar:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Insira o custo real do produto</li>
              <li>• Configure sua alíquota de impostos</li>
              <li>• Defina a margem de lucro desejada</li>
              <li>• O sistema calculará o preço ideal automaticamente</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingInfo;
