
export interface AIResponse {
  improvedText: string;
  keywords: string[];
  searchTitles?: string[];
  allKeywords?: string[];
  technicalSheet?: string;
}

export interface DualAIResponse {
  geminiResult: AIResponse | null;
  openaiResult: AIResponse | null;
  availableResults: string[];
  errors?: {
    gemini: string | null;
    openai: string | null;
  };
}
