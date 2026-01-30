import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const YouTubeVideoSection = () => {
  const [videoId, setVideoId] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState<string>("Como a IA transforma suas fotos");
  const [videoId2, setVideoId2] = useState<string>("");
  const [videoTitle2, setVideoTitle2] = useState<string>("Tutorial Passo a Passo");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('site_config')
          .select('key, value')
          .in('key', ['youtube_video_id', 'youtube_video_title', 'youtube_video_id_2', 'youtube_video_title_2']);

        if (error) throw error;

        data?.forEach(item => {
          if (item.key === 'youtube_video_id' && item.value) {
            setVideoId(item.value);
          }
          if (item.key === 'youtube_video_title' && item.value) {
            setVideoTitle(item.value);
          }
          if (item.key === 'youtube_video_id_2' && item.value) {
            setVideoId2(item.value);
          }
          if (item.key === 'youtube_video_title_2' && item.value) {
            setVideoTitle2(item.value);
          }
        });
      } catch (error) {
        console.error('Error fetching video config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const hasVideo1 = videoId && videoId.length > 0;
  const hasVideo2 = videoId2 && videoId2.length > 0;
  const hasBothVideos = hasVideo1 && hasVideo2;

  const VideoPlaceholder = ({ label }: { label: string }) => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        <Play className="w-8 h-8 text-primary ml-1" />
      </div>
      <p className="text-muted-foreground text-xs text-center px-4">
        {label}
      </p>
    </div>
  );

  const VideoCard = ({ 
    id, 
    title, 
    hasVideo, 
    placeholderLabel 
  }: { 
    id: string; 
    title: string; 
    hasVideo: boolean; 
    placeholderLabel: string;
  }) => (
    <div className="space-y-3">
      <div className="aspect-video rounded-2xl overflow-hidden shadow-xl border border-border bg-card relative group">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse">
            <Play className="w-10 h-10 text-muted-foreground" />
          </div>
        ) : hasVideo ? (
          <iframe
            src={`https://www.youtube.com/embed/${id}?rel=0`}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <VideoPlaceholder label={placeholderLabel} />
        )}
        
        {/* Decorative glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-2xl blur-xl opacity-40 -z-10" />
      </div>
      {hasVideo && (
        <p className="text-center text-sm font-medium text-muted-foreground">{title}</p>
      )}
    </div>
  );

  return (
    <section className="py-8 md:py-12 bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10">
          <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
            <Play className="w-4 h-4 mr-2" />
            Veja em Ação
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold font-display mb-3">
            Descubra Como Funciona
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Assista e entenda como nossa IA transforma suas fotos simples em anúncios profissionais que vendem
          </p>
        </div>

        {/* Video Container - Grid layout */}
        <div className={`mx-auto ${hasBothVideos ? 'max-w-6xl' : 'max-w-4xl'}`}>
          <div className={`grid gap-6 ${hasBothVideos ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Video 1 */}
            <VideoCard 
              id={videoId}
              title={videoTitle}
              hasVideo={hasVideo1}
              placeholderLabel="Vídeo 1 - Configure em Configurações → Site"
            />
            
            {/* Video 2 - Only show if configured or both empty */}
            {(hasVideo2 || !hasVideo1) && (
              <VideoCard 
                id={videoId2}
                title={videoTitle2}
                hasVideo={hasVideo2}
                placeholderLabel="Vídeo 2 - Configure em Configurações → Site"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default YouTubeVideoSection;
