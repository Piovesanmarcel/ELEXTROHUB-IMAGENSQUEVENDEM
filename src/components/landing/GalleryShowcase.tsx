import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShowcaseImage {
  id: string;
  url: string;
  filename: string;
  product_id?: string;
}

// Seeded shuffle for consistent randomization during session
const seededShuffle = <T,>(array: T[], seed: number): T[] => {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let randomSeed = seed;
  
  while (currentIndex !== 0) {
    randomSeed = (randomSeed * 9301 + 49297) % 233280;
    const randomIndex = Math.floor((randomSeed / 233280) * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  return shuffled;
};

// Distribute images across products for variety
const distributeImagesByProduct = (
  images: ShowcaseImage[], 
  maxPerProduct: number, 
  totalNeeded: number,
  seed: number
): ShowcaseImage[] => {
  // Group by product_id
  const byProduct = images.reduce((acc, img) => {
    const key = img.product_id || 'no-product';
    if (!acc[key]) acc[key] = [];
    acc[key].push(img);
    return acc;
  }, {} as Record<string, ShowcaseImage[]>);

  const result: ShowcaseImage[] = [];
  const productIds = Object.keys(byProduct);
  
  // Shuffle product order with seed
  const shuffledProducts = seededShuffle(productIds, seed);
  
  // Pick up to maxPerProduct from each product in rounds
  let round = 0;
  while (result.length < totalNeeded && round < maxPerProduct) {
    for (const productId of shuffledProducts) {
      const productImages = byProduct[productId];
      if (productImages[round]) {
        result.push(productImages[round]);
        if (result.length >= totalNeeded) break;
      }
    }
    round++;
  }

  return seededShuffle(result, seed + 1);
};

const GalleryShowcase = () => {
  const [images, setImages] = useState<ShowcaseImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shuffleSeed] = useState(() => Math.floor(Math.random() * 10000));

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Fetch ONLY Marketing Canvas images (template_id not null)
        const { data, error } = await supabase
          .from('hosted_images')
          .select('id, url, original_filename, product_id, template_id')
          .eq('is_public', true)
          .not('template_id', 'is', null)
          .like('url', 'https://%')
          .limit(300);

        if (error || !data || data.length < 12) {
          console.log('Gallery: Not enough Marketing Canvas images, count:', data?.length || 0);
          setImages([]);
        } else {
          // Map to ShowcaseImage format
          const mappedImages: ShowcaseImage[] = data.map(img => ({
            id: img.id,
            url: img.url,
            filename: img.original_filename || 'marketing-image',
            product_id: img.product_id || undefined
          }));
          
          // Distribute: 4 images per product, 36 total
          const diverseImages = distributeImagesByProduct(mappedImages, 4, 36, shuffleSeed);
          setImages(diverseImages);
        }
      } catch (err) {
        console.error('Gallery fetch error:', err);
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [shuffleSeed]);

  // Split images into 3 rows
  const rows = useMemo(() => {
    if (images.length === 0) return [[], [], []];
    const third = Math.ceil(images.length / 3);
    return [
      images.slice(0, third),
      images.slice(third, third * 2),
      images.slice(third * 2),
    ];
  }, [images]);

  if (isLoading) {
    return (
      <section className="py-8 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando galeria...</div>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no images
  if (images.length === 0) {
    return null;
  }

  return (
    <section id="galeria" className="py-8 md:py-12 overflow-hidden bg-secondary/50">
      <div className="container mx-auto px-4 mb-6">
        <div className="text-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
            <Image className="w-4 h-4 mr-2" />
            Galeria de Resultados
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold font-display mb-3">
            Veja o Que Nossos Usuários{' '}
            <span className="text-gradient-coral">Estão Criando</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Milhares de anúncios profissionais gerados com IA — o seu pode ser o próximo
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row, rowIndex) => (
          row.length > 0 && (
            <div 
              key={rowIndex}
              className="relative overflow-hidden"
            >
              <div 
                className="flex gap-4"
                style={{
                  animation: `${rowIndex % 2 === 0 ? 'scroll-left' : 'scroll-right'} ${20 + rowIndex * 5}s linear infinite`,
                  width: 'fit-content',
                }}
              >
                {/* Duplicate images for seamless loop */}
                {[...row, ...row].map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    className="flex-shrink-0 w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden group relative"
                  >
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading={index < 6 ? "eager" : "lazy"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div className="flex items-center gap-2 text-white text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>Marketing Canvas</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Gradient overlays for fade effect */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-secondary/50 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-secondary/50 to-transparent z-10" />
    </section>
  );
};

export default GalleryShowcase;
