import { ResultCardHeader } from "./ResultCardHeader";
import { ResultCardContent } from "./ResultCardContent";
import { ResultCardActions } from "./ResultCardActions";
import { ResultCardKeywords } from "./ResultCardKeywords";
import { AIResponse } from "./types";

interface ResultCardProps {
  commandKey: string;
  result: AIResponse;
  config: { label: string; number: string };
  onCopy: (text: string) => void;
  onApply?: () => void;
}

export const ResultCard = ({ commandKey, result, config, onCopy, onApply }: ResultCardProps) => {
  const getDisplayText = () => {
    if (result.improvedText) {
      return result.improvedText;
    }
    
    if (result.faqs && result.faqs.length > 0) {
      return result.faqs.map((faq, index) => 
        `${index + 1}. ${faq.question}\n   ${faq.answer}`
      ).join('\n\n');
    }
    
    if (result.hooks && result.hooks.length > 0) {
      return result.hooks.map((hook, index) => `${index + 1}. ${hook}`).join('\n\n');
    }
    
    if (result.titles && result.titles.length > 0) {
      return result.titles.map((title, index) => `${index + 1}. ${title}`).join('\n\n');
    }
    
    if (result.seoTitles && result.seoTitles.length > 0) {
      return result.seoTitles.map((title, index) => `${index + 1}. ${title}`).join('\n\n');
    }
    
    if (result.ctas && result.ctas.length > 0) {
      return result.ctas.map((cta, index) => `${index + 1}. ${cta}`).join('\n\n');
    }
    
    if (result.descriptions && result.descriptions.length > 0) {
      return result.descriptions.map((desc, index) => `${index + 1}. ${desc}`).join('\n\n');
    }
    
    return 'Conteúdo processado com sucesso';
  };

  const displayText = getDisplayText();

  return (
    <div className="border rounded-lg p-4 bg-white border-gray-200">
      <ResultCardHeader label={config.label} />
      <ResultCardContent improvedText={displayText} />
      <ResultCardActions improvedText={displayText} onCopy={onCopy} onApply={onApply} />
      <ResultCardKeywords keywords={result.keywords || []} onCopy={onCopy} />
    </div>
  );
};
