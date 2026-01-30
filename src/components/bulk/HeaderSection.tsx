
import { Images } from "lucide-react";

export const HeaderSection = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
          <Images className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Melhoria de Imagens em Massa
        </h1>
      </div>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Processe múltiplas imagens simultaneamente com IA avançada da DeepAI. 
        Melhore qualidade e remova fundos em lote para otimizar seu fluxo de trabalho.
      </p>
    </div>
  );
};
