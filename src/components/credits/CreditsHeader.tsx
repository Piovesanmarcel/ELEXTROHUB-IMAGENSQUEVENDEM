
import { Zap } from "lucide-react";

export const CreditsHeader = () => {
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
        <Zap className="h-5 w-5 text-purple-600" />
        <span className="text-purple-600 font-medium">Melhoria de Imagens com IA</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-900">
        Transforme Suas Imagens de Produto
      </h1>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Use nossa tecnologia de IA avançada para melhorar automaticamente a qualidade das suas imagens e aumentar suas vendas
      </p>
    </div>
  );
};
