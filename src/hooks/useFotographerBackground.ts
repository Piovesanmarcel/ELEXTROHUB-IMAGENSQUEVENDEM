import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface FotographerBackgroundResult {
  success: boolean;
  original_url: string | null;
  background_url: string | null;
  style?: string;
  processing_time?: string;
  error?: string;
  message?: string;
  metadata?: {
    resolution?: string;
    format?: string;
    processor?: string;
    fotographer_id?: string;
    note?: string;
  };
}

export const useFotographerBackground = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateBackground = async (
    imageUrl: string,
    prompt?: string,
    style?: string
  ): Promise<FotographerBackgroundResult> => {
    setIsProcessing(true);
    setProgress(10);

    try {
      console.log('🎨 Iniciando geração de background com Fotographer.ai...');
      console.log('Image URL:', imageUrl);
      console.log('Prompt:', prompt);
      console.log('Style:', style);

      setProgress(30);

      const { data, error } = await supabase.functions.invoke('fotographer-background', {
        body: {
          imageUrl,
          prompt: prompt || 'professional product photography background, clean studio lighting',
          style: style || 'realistic'
        }
      });

      setProgress(70);

      if (error) {
        console.error('Erro na função Supabase:', error);
        throw new Error(error.message || 'Erro ao chamar a função de background');
      }

      setProgress(90);

      if (!data) {
        throw new Error('Nenhum dado retornado da API');
      }

      console.log('✅ Background gerado com sucesso:', data);

      if (data.success && data.background_url) {
        toast({
          title: "Background gerado com sucesso!",
          description: `Processado em ${data.processing_time || 'tempo não informado'}`,
        });

        setProgress(100);
        return data;
      } else {
        const errorMessage = data.error || data.message || 'Falha ao gerar background';
        console.error('❌ Erro no processamento:', errorMessage);
        
        toast({
          title: "Erro ao gerar background",
          description: errorMessage,
          variant: "destructive",
        });

        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('❌ Erro no hook useFotographerBackground:', error);
      
      toast({
        title: "Erro ao gerar background",
        description: error.message || 'Erro interno do sistema',
        variant: "destructive",
      });

      setProgress(0);
      throw error;
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    generateBackground,
    isProcessing,
    progress
  };
};