import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DescriptionSuggesterProps {
    value: string;
    onChange: (description: string) => void;
    images: string[];
    disabled?: boolean;
}

const DescriptionSuggester = ({
    value,
    onChange,
    images,
    disabled
}: DescriptionSuggesterProps) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSuggest = async () => {
        if (images.length < 2) {
            toast.error('Adicione pelo menos 2 imagens para gerar sugestoes');
            return;
        }

        setIsLoading(true);
        setSuggestions([]);

        try {
            const { data, error } = await supabase.functions.invoke('gemini-background-generator', {
                body: {
                    action: 'suggest_kit_description',
                    imageData: images,
                    prompt: `Analyze these ${images.length} product images and suggest 4-5 creative kit/bundle names.

RULES:
- Names should be in Portuguese (Brazil)
- Mix of professional and appealing styles
- Include category words like: Gourmet, Premium, Pro, Master, Completo, Especial
- Be concise (3-5 words max each)
- Consider the product types and their synergy

RESPONSE FORMAT:
Return ONLY a JSON array of strings, nothing else:
["Sugestao 1", "Sugestao 2", "Sugestao 3", "Sugestao 4", "Sugestao 5"]`
                }
            });

            if (error) throw error;

            let parsedSuggestions: string[] = [];

            if (data?.generatedText) {
                try {
                    const jsonMatch = data.generatedText.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        parsedSuggestions = JSON.parse(jsonMatch[0]);
                    }
                } catch (parseError) {
                    parsedSuggestions = data.generatedText
                        .split('\n')
                        .map((s: string) => s.replace(/^[-*•\d.)\s]+/, '').trim())
                        .filter((s: string) => s.length > 3 && s.length < 50);
                }
            }

            if (parsedSuggestions.length > 0) {
                setSuggestions(parsedSuggestions.slice(0, 5));
                toast.success('Sugestoes geradas!');
            } else {
                toast.error('Nao foi possivel gerar sugestoes');
            }
        } catch (error) {
            console.error('Error getting suggestions:', error);
            toast.error('Erro ao gerar sugestoes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSuggestion = (suggestion: string) => {
        onChange(suggestion);
        setSuggestions([]);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Label htmlFor="kitDescription" className="flex-1">
                    Descricao do Kit (opcional)
                </Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSuggest}
                    disabled={disabled || isLoading || images.length < 2}
                    className="gap-1.5"
                >
                    {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Sugerir
                </Button>
            </div>

            <Input
                id="kitDescription"
                placeholder='Ex: "Kit Churrasco Completo", "Combo Gamer Premium"'
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            />

            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleSelectSuggestion(suggestion)}
                        >
                            {suggestion}
                        </Badge>
                    ))}
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Ajuda a IA a entender o contexto e posicionar os produtos adequadamente
            </p>
        </div>
    );
};

export default DescriptionSuggester;
