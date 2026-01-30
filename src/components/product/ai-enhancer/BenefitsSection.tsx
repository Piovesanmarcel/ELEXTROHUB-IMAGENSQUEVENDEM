
import { Award, ShoppingCart, Zap, Search, Gift } from "lucide-react";

export const BenefitsSection = () => {
  return (
    <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-green-300 p-6 rounded-xl shadow-sm overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full opacity-30 -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-100 to-transparent rounded-full opacity-30 -ml-12 -mb-12"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-600 p-2 rounded-lg">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-green-800 text-lg">Benefícios da Melhoria com IA</h3>
            <p className="text-green-700 text-sm">Maximize suas vendas com conteúdo completo e otimizado</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-green-200/50 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-1">Conversão em Vendas</h4>
                <p className="text-green-700 leading-relaxed">Tópicos otimizados aumentam significativamente a taxa de conversão ao destacar benefícios e características que realmente importam para o cliente.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-green-200/50 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-1">Anúncios Profissionais</h4>
                <p className="text-green-700 leading-relaxed">Descrições estruturadas e persuasivas elevam a qualidade dos seus anúncios, transmitindo confiança e profissionalismo.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-green-200/50 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Search className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-1">SEO e Visibilidade</h4>
                <p className="text-green-700 leading-relaxed">Conteúdo otimizado com palavras-chave relevantes melhora o posicionamento nos resultados de busca, aumentando a visibilidade.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-green-200/50 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Gift className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-1">Kits e Ticket Médio</h4>
                <p className="text-green-700 leading-relaxed">Sugestões de kits criativos e opções de quantidade ajudam a aumentar o valor médio do pedido e criar ofertas atrativas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
