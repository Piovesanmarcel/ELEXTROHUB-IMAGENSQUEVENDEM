import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIAnalysisResult {
  templateName: string;
  dimensions: { width: number; height: number };
  detectedFonts: string[];
  colorScheme?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  zones: Array<{
    id: string;
    type: 'image' | 'text' | 'badge';
    position: { x: number; y: number; width: number; height: number };
    zIndex: number;
    dataSource: string;
    classification: 'product' | 'background' | 'text';
    style: Record<string, any>;
  }>;
}

export interface TemplateMapperResult {
  success: boolean;
  template?: any;
  analysis?: AIAnalysisResult;
  error?: string;
}

export const useTemplateAIMapper = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadAndAnalyze = async (
    file: File,
    templateKey: string,
    templateName: string,
    category: string = 'Geral 01'
  ): Promise<TemplateMapperResult> => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setAnalysisResult(null);

    try {
      // Step 1: Convert to base64
      setCurrentStatus('Preparando imagem...');
      setProgress(10);
      const imageBase64 = await fileToBase64(file);

      // Step 2: Call analyze-template edge function
      setCurrentStatus('Enviando para análise com IA...');
      setProgress(20);

      const { data, error: functionError } = await supabase.functions.invoke('analyze-template', {
        body: {
          imageBase64,
          templateKey,
          templateName,
          category,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Análise falhou');
      }

      setCurrentStatus('Processando resultado...');
      setProgress(90);

      setAnalysisResult(data.analysis);
      setCurrentStatus('✅ Mapeamento concluído!');
      setProgress(100);

      toast.success('Template mapeado com sucesso!', {
        description: `${data.analysis.zones.length} zonas detectadas`,
      });

      return {
        success: true,
        template: data.template,
        analysis: data.analysis,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setCurrentStatus('❌ Erro na análise');
      toast.error('Erro ao mapear template', {
        description: errorMessage,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setIsAnalyzing(false);
    setProgress(0);
    setCurrentStatus('');
    setAnalysisResult(null);
    setError(null);
  };

  return {
    isAnalyzing,
    progress,
    currentStatus,
    analysisResult,
    error,
    uploadAndAnalyze,
    reset,
  };
};
