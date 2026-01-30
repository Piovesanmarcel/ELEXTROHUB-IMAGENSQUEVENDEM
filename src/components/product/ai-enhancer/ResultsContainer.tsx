
import { toast } from "sonner";
import { UnifiedAIResponse } from "./types";
import { ResultCard } from "./ResultCard";
import { ErrorDisplay } from "./ErrorDisplay";
import { BenefitsSection } from "./BenefitsSection";
import { convertToAIResponse, commandLabels } from "./utils/resultConverter";

interface ResultsContainerProps {
  unifiedResults: UnifiedAIResponse;
  onUpdateDescription: (type: 'short' | 'long' | 'name', value: string) => void;
}

export const ResultsContainer = ({ unifiedResults, onUpdateDescription }: ResultsContainerProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Texto copiado para a área de transferência!');
  };

  const applyTopicosConversao = () => {
    if (unifiedResults?.topicos_conversao) {
      onUpdateDescription('short', unifiedResults.topicos_conversao.improvedText);
      toast.success('Tópicos de Conversão aplicados com sucesso!');
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-4 dark:bg-gray-800 dark:border-gray-600">
      {Object.entries(commandLabels).map(([commandKey, config]) => {
        const result = unifiedResults[commandKey as keyof typeof commandLabels];
        if (!result) return null;

        const convertedResult = convertToAIResponse(result);

        return (
          <ResultCard
            key={commandKey}
            commandKey={commandKey}
            result={convertedResult}
            config={config}
            onCopy={copyToClipboard}
            onApply={commandKey === 'topicos_conversao' ? applyTopicosConversao : undefined}
          />
        );
      })}

      <ErrorDisplay unifiedResults={unifiedResults} />
      <BenefitsSection />
    </div>
  );
};
