import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HostedImagesCount {
  [productId: string]: number;
}

export function useHostedImagesCount() {
  const [hostedImagesCount, setHostedImagesCount] = useState<HostedImagesCount>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchHostedImagesCount();
  }, []);

  const fetchHostedImagesCount = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("❌ Usuário não autenticado");
        return;
      }

      // Buscar todas as imagens hospedadas do usuário
      const { data: images, error } = await supabase
        .from('hosted_images')
        .select('tags')
        .eq('user_id', user.id);

      if (error) {
        console.error("Erro ao buscar imagens hospedadas:", error);
        return;
      }

      // Contar imagens por produto
      const countMap: HostedImagesCount = {};
      
      images?.forEach((image) => {
        if (image.tags) {
          // Procurar tag que começa com "product:"
          const productTag = image.tags.find((tag: string) => tag.startsWith('product:'));
          if (productTag) {
            const productId = productTag.replace('product:', '');
            countMap[productId] = (countMap[productId] || 0) + 1;
          }
        }
      });

      console.log("📊 Contagem de imagens hospedadas por produto:", countMap);
      setHostedImagesCount(countMap);
    } catch (error) {
      console.error("Erro ao processar contagem de imagens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hostedImagesCount,
    isLoading,
    refreshCount: fetchHostedImagesCount,
  };
}
