
import { useState, useEffect } from 'react';
import { Product } from '@/lib/supabase';

interface ImageQualityResult {
  productId: string;
  needsImprovement: boolean;
  poorQualityImages: number;
  totalImages: number;
  hasSmallImages: boolean;
  hasPoorQuality: boolean;
}

export const useImageQualityAnalysis = (products: Product[]) => {
  const [qualityResults, setQualityResults] = useState<Map<string, any>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImageQuality = async (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const totalPixels = width * height;

        // Análise de resolução
        let resolution: 'low' | 'medium' | 'high' = 'low';
        if (totalPixels >= 1000000) resolution = 'high';
        else if (totalPixels >= 500000) resolution = 'medium';

        // Análise de nitidez baseada em tamanho
        let sharpness: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
        if (width >= 1200 && height >= 1200) sharpness = 'excellent';
        else if (width >= 800 && height >= 800) sharpness = 'good';
        else if (width >= 500 && height >= 500) sharpness = 'fair';

        // Análise de cores baseada na resolução
        let colors: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
        if (resolution === 'high') colors = 'good';
        else if (resolution === 'medium') colors = 'fair';

        // Análise de iluminação
        let lighting: 'poor' | 'fair' | 'good' | 'excellent' = 'fair';
        if (resolution === 'high' && sharpness === 'excellent') lighting = 'good';

        // Análise geral
        const scores = { poor: 0, fair: 1, good: 2, excellent: 3 };
        const avgScore = (scores[sharpness] + scores[colors] + scores[lighting]) / 3;
        
        let overall: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
        if (avgScore >= 2.5) overall = 'excellent';
        else if (avgScore >= 2) overall = 'good';
        else if (avgScore >= 1) overall = 'fair';

        const needsImprovement = overall === 'poor';
        resolve(needsImprovement);
      };

      img.onerror = () => {
        resolve(true); // Se não conseguir carregar, considera que precisa de melhoria
      };

      img.src = imageUrl;
    });
  };

  const analyzeProducts = async () => {
    if (products.length === 0) return;

    setIsAnalyzing(true);
    const resultsMap = new Map();

    for (const product of products) {
      const images = [
        product.imagem_url,
        product.imagem_url_2,
        product.imagem_url_3,
        product.imagem_url_4,
        product.imagem_url_5,
        product.imagem_url_6,
        product.imagem_url_7,
        product.imagem_url_8,
        product.imagem_url_9,
        product.imagem_url_10
      ].filter(Boolean) as string[];

      if (images.length === 0) {
        resultsMap.set(product.id, {
          needsImprovement: true,
          poorQualityImages: 0,
          totalImages: 0,
          hasSmallImages: false,
          hasPoorQuality: true
        });
        continue;
      }

      let poorQualityCount = 0;
      let hasSmallImages = false;
      
      for (const imageUrl of images) {
        const needsImprovement = await analyzeImageQuality(imageUrl);
        if (needsImprovement) {
          poorQualityCount++;
        }
        
        // Check if image is small (simplified check)
        if (imageUrl.includes('thumb') || imageUrl.includes('small')) {
          hasSmallImages = true;
        }
      }

      resultsMap.set(product.id, {
        needsImprovement: poorQualityCount > 0,
        poorQualityImages: poorQualityCount,
        totalImages: images.length,
        hasSmallImages,
        hasPoorQuality: poorQualityCount > 0
      });
    }

    setQualityResults(resultsMap);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (products.length > 0) {
      analyzeProducts();
    }
  }, [products]);

  const productsNeedingImprovement = Array.from(qualityResults.values()).filter(result => result.needsImprovement).length;
  const totalImagesNeedingImprovement = Array.from(qualityResults.values()).reduce((sum, result) => sum + result.poorQualityImages, 0);

  return {
    qualityResults,
    isAnalyzing,
    productsNeedingImprovement,
    totalImagesNeedingImprovement,
    analyzeProducts
  };
};
