
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, Eye, Sparkles, ZoomIn, Check } from "lucide-react";

export const MarketplaceBenefitsSection = () => {
  return (
    <div className="flex justify-center mt-12 space-y-6">
      {/* Benefícios de Imagens de Alta Resolução */}
      <div className="max-w-7xl w-full space-y-6">
        <Card className="glass-effect shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
            <CardTitle className="flex items-center justify-center gap-2 text-orange-700">
              <TrendingUp className="h-5 w-5" />
              Benefícios de Imagens de Alta Resolução para Vendas em Marketplaces
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Como imagens melhoradas podem aumentar suas conversões e vendas
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Maior Taxa de Conversão</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Produtos com imagens de alta qualidade têm até <strong>40% mais conversões</strong> em marketplaces como Amazon, Mercado Livre e Shopee.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-green-800">Melhor Posicionamento</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Algoritmos de marketplaces favorecem produtos com imagens nítidas e de alta resolução, melhorando seu <strong>ranking nos resultados</strong>.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <h3 className="font-semibold text-purple-800">Credibilidade</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Imagens profissionais transmitem <strong>confiança e qualidade</strong>, reduzindo devoluções e aumentando avaliações positivas.
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-100">
                <div className="flex items-center gap-3 mb-4">
                  <ZoomIn className="h-6 w-6 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800">Detalhamento Premium</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Clientes podem ver <strong>todos os detalhes do produto</strong> com clareza, reduzindo dúvidas e aumentando a confiança na compra.
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border border-red-100">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                  <h3 className="font-semibold text-red-800">Preços Premium</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Produtos com imagens profissionais podem ser vendidos com <strong>margens 15-30% maiores</strong> devido à percepção de qualidade.
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-100">
                <div className="flex items-center gap-3 mb-4">
                  <Check className="h-6 w-6 text-teal-600" />
                  <h3 className="font-semibold text-teal-800">Menos Devoluções</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Imagens claras e detalhadas reduzem <strong>expectativas incorretas</strong>, diminuindo devoluções em até 25%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dica Profissional */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3 text-center">
            💡 Dica Profissional: O Impacto Real do Upscale em Vendas Online
          </h4>
          <p className="text-sm text-gray-700 text-center max-w-4xl mx-auto">
            Estudos comprovam que cada melhoria na qualidade da imagem (resolução, nitidez, cores, contraste) 
            contribui diretamente para o aumento das vendas. O processo de upscale com IA não apenas 
            melhora a aparência visual, mas também otimiza suas imagens para os algoritmos dos marketplaces, 
            resultando em melhor visibilidade, mais vendas e menos penalidades por imagens de baixa qualidade.
          </p>
        </div>
      </div>
    </div>
  );
};
