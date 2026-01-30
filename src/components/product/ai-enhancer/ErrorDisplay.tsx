
import { UnifiedAIResponse } from "./types";

interface ErrorDisplayProps {
  unifiedResults: UnifiedAIResponse;
}

export const ErrorDisplay = ({ unifiedResults }: ErrorDisplayProps) => {
  if (!unifiedResults.errors || (!unifiedResults.errors.gemini && !unifiedResults.errors.openai)) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
      <div className="text-sm text-yellow-800">
        <strong>Avisos:</strong>
        {unifiedResults.errors.gemini && (
          <div>• Gemini: {unifiedResults.errors.gemini}</div>
        )}
        {unifiedResults.errors.openai && (
          <div>• OpenAI: {unifiedResults.errors.openai}</div>
        )}
      </div>
    </div>
  );
};
