
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancementCard } from "./ai-enhancer/EnhancementCard";

interface AIDescriptionEnhancerProps {
  productName: string;
  shortDescription: string;
  onUpdateDescription: (type: 'short' | 'long' | 'name', value: string) => void;
}

export const AIDescriptionEnhancer = ({ 
  productName, 
  shortDescription, 
  onUpdateDescription 
}: AIDescriptionEnhancerProps) => {
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Melhoria com Agentes de Conversão
          Melhoria de Descrição com IA
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Utilize inteligência artificial para aprimorar a descrição do seu produto com conteúdo otimizado e palavras-chave estratégicas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <EnhancementCard
            type="short"
            title="Descrição Completa"
            originalText={shortDescription}
            icon={<MessageSquare className="h-4 w-4" />}
            description="Gere uma descrição estruturada completa com ficha técnica e palavras-chave otimizadas"
            buttonText="Melhorar com IA"
            productName={productName}
            shortDescription={shortDescription}
            onUpdateDescription={onUpdateDescription}
          />
        </div>
      </CardContent>
    </Card>
  );
};
