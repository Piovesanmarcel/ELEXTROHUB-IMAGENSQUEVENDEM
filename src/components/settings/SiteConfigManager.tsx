import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Youtube, Save, ExternalLink, Eye } from 'lucide-react';

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  
  // If it's already just an ID (11 characters, alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }
  
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

const SiteConfigManager = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [extractedId, setExtractedId] = useState<string | null>(null);
  
  const [youtubeUrl2, setYoutubeUrl2] = useState('');
  const [youtubeTitle2, setYoutubeTitle2] = useState('');
  const [extractedId2, setExtractedId2] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    const id = extractYouTubeId(youtubeUrl);
    setExtractedId(id);
  }, [youtubeUrl]);

  useEffect(() => {
    const id = extractYouTubeId(youtubeUrl2);
    setExtractedId2(id);
  }, [youtubeUrl2]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('key, value')
        .in('key', ['youtube_video_id', 'youtube_video_title', 'youtube_video_id_2', 'youtube_video_title_2']);

      if (error) throw error;

      data?.forEach(item => {
        if (item.key === 'youtube_video_id' && item.value) {
          setYoutubeUrl(item.value);
        }
        if (item.key === 'youtube_video_title' && item.value) {
          setYoutubeTitle(item.value);
        }
        if (item.key === 'youtube_video_id_2' && item.value) {
          setYoutubeUrl2(item.value);
        }
        if (item.key === 'youtube_video_title_2' && item.value) {
          setYoutubeTitle2(item.value);
        }
      });
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extractedId && !extractedId2) {
      toast.error('Configure pelo menos um vídeo do YouTube');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update video 1
      if (extractedId) {
        await supabase
          .from('site_config')
          .update({ value: extractedId, updated_by: user?.id })
          .eq('key', 'youtube_video_id');
      }

      if (youtubeTitle) {
        await supabase
          .from('site_config')
          .update({ value: youtubeTitle, updated_by: user?.id })
          .eq('key', 'youtube_video_title');
      }

      // Update video 2
      if (extractedId2) {
        await supabase
          .from('site_config')
          .update({ value: extractedId2, updated_by: user?.id })
          .eq('key', 'youtube_video_id_2');
      }

      if (youtubeTitle2) {
        await supabase
          .from('site_config')
          .update({ value: youtubeTitle2, updated_by: user?.id })
          .eq('key', 'youtube_video_title_2');
      }

      toast.success('Configurações do site salvas com sucesso!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* YouTube Configuration - Video 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-destructive" />
            Vídeo 1 - YouTube da Homepage
          </CardTitle>
          <CardDescription>
            Configure o primeiro vídeo explicativo que aparece na página inicial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">URL ou ID do Vídeo 1</Label>
            <Input
              id="youtube-url"
              placeholder="https://www.youtube.com/watch?v=abc123XYZ ou abc123XYZ"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cole a URL completa do YouTube ou apenas o ID do vídeo (11 caracteres)
            </p>
          </div>

          {extractedId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                ID Extraído: <code className="bg-muted px-2 py-1 rounded text-sm">{extractedId}</code>
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="youtube-title">Título do Vídeo 1 (Acessibilidade)</Label>
            <Input
              id="youtube-title"
              placeholder="Como a IA transforma suas fotos"
              value={youtubeTitle}
              onChange={(e) => setYoutubeTitle(e.target.value)}
            />
          </div>

          {/* Preview */}
          {extractedId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Preview
              </Label>
              <div className="aspect-video rounded-lg overflow-hidden border bg-muted max-w-sm">
                <iframe
                  src={`https://www.youtube.com/embed/${extractedId}?rel=0`}
                  title={youtubeTitle || 'Preview do vídeo 1'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* YouTube Configuration - Video 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-destructive" />
            Vídeo 2 - YouTube da Homepage
          </CardTitle>
          <CardDescription>
            Configure o segundo vídeo que aparece lado a lado na página inicial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url-2">URL ou ID do Vídeo 2</Label>
            <Input
              id="youtube-url-2"
              placeholder="https://www.youtube.com/watch?v=abc123XYZ ou abc123XYZ"
              value={youtubeUrl2}
              onChange={(e) => setYoutubeUrl2(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cole a URL completa do YouTube ou apenas o ID do vídeo (11 caracteres)
            </p>
          </div>

          {extractedId2 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                ID Extraído: <code className="bg-muted px-2 py-1 rounded text-sm">{extractedId2}</code>
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="youtube-title-2">Título do Vídeo 2 (Acessibilidade)</Label>
            <Input
              id="youtube-title-2"
              placeholder="Tutorial Passo a Passo"
              value={youtubeTitle2}
              onChange={(e) => setYoutubeTitle2(e.target.value)}
            />
          </div>

          {/* Preview */}
          {extractedId2 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Preview
              </Label>
              <div className="aspect-video rounded-lg overflow-hidden border bg-muted max-w-sm">
                <iframe
                  src={`https://www.youtube.com/embed/${extractedId2}?rel=0`}
                  title={youtubeTitle2 || 'Preview do vídeo 2'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={isSaving || (!extractedId && !extractedId2)}
        className="w-full sm:w-auto"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </div>
  );
};

export default SiteConfigManager;
