import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    ImagePlus,
    Link as LinkIcon,
    X,
    Loader2,
    Lightbulb
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import type { KitStyle, KitLayout, SingleProductKitRequest } from '@/types/kit-generator';
import LayoutSelector from './LayoutSelector';
import StyleSelector, { styleOptions } from './StyleSelector';

interface SingleProductModeProps {
    onGenerate: (request: SingleProductKitRequest) => Promise<void>;
    isProcessing: boolean;
    selectedStyles: KitStyle[];
    setSelectedStyles: (styles: KitStyle[]) => void;
    layout: KitLayout;
    setLayout: (layout: KitLayout) => void;
}

const CTA_SUGGESTIONS: Record<number, string[]> = {
    2: ['Kit Duplo', 'Leve 2', 'Combo Duo'],
    3: ['Kit com 3', 'Leve 3 Pague 2', 'Combo Triplo'],
    4: ['Pack com 4', 'Kit Familia', 'Quarteto'],
    5: ['Kit com 5 unidades', 'Super Pack', 'Economia Garantida'],
    6: ['Meia Duzia', 'Pack 6 unidades', 'Kit Economico'],
    10: ['Mega Kit 10 unidades', 'Atacado', 'Pack Familia'],
    12: ['Caixa com 12', 'Duzia Promocional', 'Pack Completo'],
    20: ['Super Atacado', 'Kit 20 Unidades', 'Mega Economia']
};

const getSuggestions = (quantity: number): string[] => {
    if (CTA_SUGGESTIONS[quantity]) return CTA_SUGGESTIONS[quantity];
    if (quantity <= 3) return CTA_SUGGESTIONS[3];
    if (quantity <= 6) return [`Kit com ${quantity}`, 'Super Economia', 'Pack Promocional'];
    if (quantity <= 12) return [`Pack ${quantity} unidades`, 'Atacado', 'Kit Familia'];
    return [`Mega Kit ${quantity}`, 'Super Atacado', 'Economia Maxima'];
};

const getStyleLabels = (styles: KitStyle[]): string => {
    if (styles.length === 0) return '';
    if (styles.length === 1) {
        const style = styleOptions.find(s => s.value === styles[0]);
        return style?.label || styles[0];
    }
    if (styles.length === 2) {
        return styles.map(s => styleOptions.find(opt => opt.value === s)?.label || s).join(', ');
    }
    return `${styles.length} estilos`;
};

export const SingleProductMode = ({
    onGenerate,
    isProcessing,
    selectedStyles,
    setSelectedStyles,
    layout,
    setLayout
}: SingleProductModeProps) => {
    const [image, setImage] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [quantity, setQuantity] = useState(3);
    const [ctaText, setCtaText] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);

    const suggestions = useMemo(() => getSuggestions(quantity), [quantity]);

    const handleDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
                setImageUrl('');
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxFiles: 1,
        disabled: isProcessing
    });

    const handleLoadUrl = async () => {
        if (!imageUrl.trim()) return;

        setIsLoadingUrl(true);
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error loading image from URL:', error);
        } finally {
            setIsLoadingUrl(false);
        }
    };

    const handleClear = () => {
        setImage(null);
        setImageUrl('');
    };

    const handleGenerate = async () => {
        if (!image || selectedStyles.length === 0) return;

        for (const style of selectedStyles) {
            await onGenerate({
                image,
                quantity,
                ctaText: ctaText.trim(),
                style,
                layout
            });
        }
    };

    const canGenerate = image !== null && selectedStyles.length > 0 && !isProcessing;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Imagem do Produto</CardTitle>
                    <CardDescription>
                        Upload a imagem do produto que sera replicado no kit
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            {image ? (
                                <div className="relative rounded-lg overflow-hidden border bg-muted aspect-square">
                                    <img
                                        src={image}
                                        alt="Produto"
                                        className="w-full h-full object-contain"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8"
                                        onClick={handleClear}
                                        disabled={isProcessing}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div
                                        {...getRootProps()}
                                        className={cn(
                                            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors aspect-square flex flex-col items-center justify-center",
                                            isDragActive
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <input {...getInputProps()} />
                                        <ImagePlus className="h-12 w-12 text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            {isDragActive
                                                ? "Solte a imagem aqui"
                                                : "Arraste uma imagem ou clique para upload"
                                            }
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Ou cole a URL da imagem"
                                                value={imageUrl}
                                                onChange={(e) => setImageUrl(e.target.value)}
                                                className="pl-9"
                                                disabled={isProcessing}
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleLoadUrl}
                                            disabled={!imageUrl.trim() || isLoadingUrl || isProcessing}
                                        >
                                            {isLoadingUrl ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Carregar'
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantidade de Unidades</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min={2}
                                    max={20}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.min(20, Math.max(2, parseInt(e.target.value) || 2)))}
                                    disabled={isProcessing}
                                    className="text-lg font-semibold"
                                />
                                <p className="text-xs text-muted-foreground">
                                    De 2 a 20 unidades do mesmo produto
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cta">Texto Promocional (CTA)</Label>
                                <Textarea
                                    id="cta"
                                    placeholder="Ex: Kit com 10 unidades - Economia de 30%"
                                    value={ctaText}
                                    onChange={(e) => setCtaText(e.target.value)}
                                    disabled={isProcessing}
                                    rows={2}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Opcional - A IA usara este texto para criar badges/selos na imagem
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                    <span>Sugestoes para {quantity} unidades:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map((suggestion) => (
                                        <Button
                                            key={suggestion}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCtaText(suggestion)}
                                            disabled={isProcessing}
                                            className="text-xs h-7"
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <LayoutSelector
                        value={layout}
                        onChange={setLayout}
                        disabled={isProcessing}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <StyleSelector
                        value={selectedStyles}
                        onChange={(styles) => setSelectedStyles(Array.isArray(styles) ? styles : [styles])}
                        disabled={isProcessing}
                        idPrefix="sp-"
                        multiSelect={true}
                        maxSelections={4}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-center">
                <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="px-8"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Gerando Kit ({quantity} unidades)...
                        </>
                    ) : (
                        <>
                            <ImagePlus className="mr-2 h-5 w-5" />
                            {selectedStyles.length > 1
                                ? `Gerar ${selectedStyles.length} Kits (${getStyleLabels(selectedStyles)})`
                                : `Gerar Kit com ${quantity} Unidades`
                            }
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default SingleProductMode;
