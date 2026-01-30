
interface ErrorDisplayLegacyProps {
  errors: {
    gemini: string | null;
    openai: string | null;
  };
}

export const ErrorDisplayLegacy = ({ errors }: ErrorDisplayLegacyProps) => {
  if (!errors || (!errors.gemini && !errors.openai)) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
      <div className="text-sm text-yellow-800">
        <strong>Avisos:</strong>
        {errors.gemini && (
          <div>• Gemini: {errors.gemini}</div>
        )}
        {errors.openai && (
          <div>• ChatGPT: {errors.openai}</div>
        )}
      </div>
    </div>
  );
};
