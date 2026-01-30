import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface MidjourneyPromptData {
  prompt_mj: string;
  imageUrl: string | null;
}

interface MidjourneyPromptsSectionProps {
  prompts: Record<string, MidjourneyPromptData>;
}

// Mapear chaves internas para labels amigáveis
const TYPE_LABELS: Record<string, string> = {
  product_studio: "📷 Studio (1:1)",
  packaging: "📦 Embalagem (4:5)",
  mockup: "🏠 Mockup (4:5)",
  lifestyle_human: "👤 Lifestyle Humano (4:5)",
  lifestyle: "🌿 Lifestyle (4:5)"
};

export function MidjourneyPromptsSection({ prompts }: MidjourneyPromptsSectionProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = async (type: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast.success("Prompt copiado!");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const promptEntries = Object.entries(prompts).filter(
    ([_, data]) => data.prompt_mj && data.prompt_mj.trim().length > 0
  );

  if (promptEntries.length === 0) {
    return null;
  }

  return (
    <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-amber-50/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-amber-100/50 to-orange-100/50 border-b border-amber-200/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Prompts Midjourney / DALL-E
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Copie os prompts gerados para usar no Midjourney, DALL-E ou outras ferramentas de geração de imagem
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {promptEntries.map(([type, data]) => (
            <div 
              key={type}
              className="p-4 rounded-lg border border-amber-200/50 bg-gradient-to-br from-white/80 to-amber-50/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-amber-800">
                  {TYPE_LABELS[type] || type}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(type, data.prompt_mj)}
                  className={`transition-all ${
                    copiedType === type 
                      ? "bg-green-100 border-green-300 text-green-700" 
                      : "border-amber-300 text-amber-700 hover:bg-amber-50"
                  }`}
                >
                  {copiedType === type ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={data.prompt_mj}
                readOnly
                className="text-sm bg-white/50 border-amber-200/50 resize-none"
                rows={4}
              />
              {data.imageUrl && (
                <div className="mt-2">
                  <img 
                    src={data.imageUrl} 
                    alt={`Preview ${type}`}
                    className="w-20 h-20 object-cover rounded-md border border-amber-200/50"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
