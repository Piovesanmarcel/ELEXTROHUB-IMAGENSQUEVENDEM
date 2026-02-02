import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKitImageGenerator, KitStyle, KitLayout } from '@/hooks/useKitImageGenerator';
import { useGeminiApiKeys } from '@/hooks/useGeminiApiKeys';
import { toast } from 'sonner';
import {
    Download,
    Loader2,
    ImageIcon,
    Sparkles,
    RefreshCw,
    Plus,
    Minus,
    Key,
    Package,
    Trash2
} from 'lucide-react';
import ProductSlot from '@/components/kit-generator/ProductSlot';
import LayoutSelector from '@/components/kit-generator/LayoutSelector';
import StyleSelector, { styleOptions } from '@/components/kit-generator/StyleSelector';
import DescriptionSuggester from '@/components/kit-generator/DescriptionSuggester';
import KitModeSelector from '@/components/kit-generator/KitModeSelector';
import SingleProductMode from '@/components/kit-generator/SingleProductMode';
import type { ProductSlot as ProductSlotType, KitMode, SingleProductKitRequest, GeneratedKitResult } from '@/types/kit-generator';
import JSZip from 'jszip';

const MIN_PRODUCTS = 2;
const MAX_PRODUCTS = 5;

const createSlot = (index: number): ProductSlotType => ({
    id: `slot-${Date.now()}-${index}`,
    image: null,
    url: ''
});

const getStyleLabel = (style: KitStyle): string => {
    const option = styleOptions.find(s => s.value === style);
    return option?.label || style;
};

const KitImageGenerator = () => {
    const [kitMode, setKitMode] = useState<KitMode>('single_product');

    const [productSlots, setProductSlots] = useState<ProductSlotType[]>([
        createSlot(0),
        createSlot(1)
    ]);
    const [sameProductMode, setSameProductMode] = useState(false);
    const [kitDescription, setKitDescription] = useState('');

    const [selectedStyles, setSelectedStyles] = useState<KitStyle[]>(['professional']);

    const [style, setStyle] = useState<KitStyle>('professional');
    const [layout, setLayout] = useState<KitLayout>('auto');

    const [generatedImages, setGeneratedImages] = useState<GeneratedKitResult[]>([]);

    const { generateKitImage, generateSingleProductKit, isProcessing, progress, lastUsage } = useKitImageGenerator();
    const { apiKeys, selectedKeyId, setSelectedKeyId, isLoading: isLoadingKeys } = useGeminiApiKeys();

    const handleSameProductModeChange = (enabled: boolean) => {
        setSameProductMode(enabled);
        if (enabled && productSlots[0]?.image) {
            setProductSlots(prev => prev.map(slot => ({
                ...slot,
                image: prev[0].image,
                url: ''
            })));
        }
    };

    const handleImageChange = useCallback((id: string, image: string | null) => {
        setProductSlots(prev => {
            const updated = prev.map(slot =>
                slot.id === id ? { ...slot, image } : slot
            );

            if (sameProductMode && image) {
                return updated.map(slot => ({ ...slot, image }));
            }

            return updated;
        });
    }, [sameProductMode]);

    const handleUrlChange = useCallback((id: string, url: string) => {
        setProductSlots(prev => prev.map(slot =>
            slot.id === id ? { ...slot, url } : slot
        ));
    }, []);

    const handleAddSlot = () => {
        if (productSlots.length >= MAX_PRODUCTS) {
            toast.error(`Maximo de ${MAX_PRODUCTS} produtos`);
            return;
        }

        const newSlot = createSlot(productSlots.length);

        if (sameProductMode && productSlots[0]?.image) {
            newSlot.image = productSlots[0].image;
        }

        setProductSlots(prev => [...prev, newSlot]);
    };

    const handleRemoveSlot = (id: string) => {
        if (productSlots.length <= MIN_PRODUCTS) {
            toast.error(`Minimo de ${MIN_PRODUCTS} produtos`);
            return;
        }
        setProductSlots(prev => prev.filter(slot => slot.id !== id));
    };

    const getValidImages = () => {
        return productSlots
            .map(slot => slot.image)
            .filter((img): img is string => img !== null);
    };

    const handleGenerate = async () => {
        const images = getValidImages();

        if (images.length < MIN_PRODUCTS) {
            toast.error(`Selecione pelo menos ${MIN_PRODUCTS} imagens`);
            return;
        }

        const result = await generateKitImage({
            images,
            kitDescription: kitDescription.trim() || undefined,
            style,
            layout,
            sameProduct: sameProductMode,
            apiKeyId: selectedKeyId && selectedKeyId !== 'default' ? selectedKeyId : undefined
        });

        if (result.success && result.generatedImage) {
            setGeneratedImages(prev => [...prev, {
                style,
                image: result.generatedImage!,
                timestamp: Date.now()
            }]);
            toast.success('Imagem de kit gerada com sucesso!');
        } else {
            toast.error(result.error || 'Erro ao gerar imagem do kit');
        }
    };

    const handleGenerateSingle = async (request: SingleProductKitRequest) => {
        const result = await generateSingleProductKit({
            ...request,
            apiKeyId: selectedKeyId && selectedKeyId !== 'default' ? selectedKeyId : undefined
        });

        if (result.success && result.generatedImage) {
            setGeneratedImages(prev => [...prev, {
                style: request.style,
                image: result.generatedImage!,
                timestamp: Date.now()
            }]);
            toast.success(`Imagem estilo "${getStyleLabel(request.style)}" gerada!`);
        } else {
            toast.error(`Erro ao gerar estilo "${getStyleLabel(request.style)}"`);
        }
    };

    const handleDownload = (result: GeneratedKitResult) => {
        const link = document.createElement('a');
        link.href = result.image;
        link.download = `kit-${result.style}-${result.timestamp}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download iniciado');
    };

    const handleDownloadAll = async () => {
        if (generatedImages.length === 0) return;

        const zip = new JSZip();

        for (const result of generatedImages) {
            const base64Data = result.image.split(',')[1];
            zip.file(`kit-${result.style}-${result.timestamp}.png`, base64Data, { base64: true });
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `kits-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        toast.success(`Download de ${generatedImages.length} imagens iniciado`);
    };

    const handleRemoveImage = (timestamp: number) => {
        setGeneratedImages(prev => prev.filter(r => r.timestamp !== timestamp));
    };

    const handleClearGallery = () => {
        setGeneratedImages([]);
    };

    const validImagesCount = getValidImages().length;
    const canGenerateMultiple = validImagesCount >= MIN_PRODUCTS && !isProcessing;

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-6xl">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
                    <Sparkles className="h-8 w-8 text-primary" />
                    Gerador de Imagens de KIT
                </h1>
                <p className="text-muted-foreground">
                    Crie imagens profissionais de kits com produtos
                </p>
            </div>

            {/* API Key Selector */}
            <Card>
                <CardContent className="pt-6">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <Label className="flex items-center gap-2 mb-2 text-primary">
                            <Key className="w-4 h-4" />
                            API Key do Gemini (Google)
                        </Label>
                        <Select
                            value={selectedKeyId || 'default'}
                            onValueChange={setSelectedKeyId}
                            disabled={isProcessing || isLoadingKeys}
                        >
                            <SelectTrigger className="w-full max-w-sm bg-background">
                                <SelectValue placeholder="Selecione a API Key" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">
                                    Key Padrao do Sistema
                                </SelectItem>
                                {apiKeys.map(key => (
                                    <SelectItem key={key.id} value={key.id}>
                                        {key.is_exhausted ? '⚠️' : '✅'} {key.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                            {isLoadingKeys
                                ? 'Carregando chaves...'
                                : apiKeys.length > 0
                                    ? `${apiKeys.filter(k => !k.is_exhausted).length} chave(s) ativa(s) de ${apiKeys.length}`
                                    : 'Configure suas chaves em Configuracoes > API Keys'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Mode Selector */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Tipo de Kit</CardTitle>
                    <CardDescription>
                        Escolha como deseja criar seu kit
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <KitModeSelector
                        value={kitMode}
                        onChange={setKitMode}
                        disabled={isProcessing}
                    />
                </CardContent>
            </Card>

            {/* Conditional Rendering based on mode */}
            {kitMode === 'single_product' ? (
                <SingleProductMode
                    onGenerate={handleGenerateSingle}
                    isProcessing={isProcessing}
                    selectedStyles={selectedStyles}
                    setSelectedStyles={setSelectedStyles}
                    layout={layout}
                    setLayout={setLayout}
                />
            ) : (
                <>
                    {/* Same Product Mode Toggle */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="same-product" className="font-medium">
                                        Modo Mesmo Produto
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Usar a mesma imagem para criar um kit com multiplas unidades
                                    </p>
                                </div>
                                <Switch
                                    id="same-product"
                                    checked={sameProductMode}
                                    onCheckedChange={handleSameProductModeChange}
                                    disabled={isProcessing}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Slots Section */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    Produtos ({validImagesCount}/{productSlots.length})
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveSlot(productSlots[productSlots.length - 1]?.id)}
                                        disabled={isProcessing || productSlots.length <= MIN_PRODUCTS}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium w-8 text-center">
                                        {productSlots.length}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddSlot}
                                        disabled={isProcessing || productSlots.length >= MAX_PRODUCTS}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardDescription>
                                {sameProductMode
                                    ? 'Upload uma imagem - ela sera usada em todos os slots'
                                    : 'Upload imagens diferentes para cada produto do kit'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {productSlots.map((slot, index) => (
                                    <ProductSlot
                                        key={slot.id}
                                        slot={slot}
                                        index={index}
                                        totalSlots={productSlots.length}
                                        onImageChange={handleImageChange}
                                        onUrlChange={handleUrlChange}
                                        onRemove={handleRemoveSlot}
                                        isProcessing={isProcessing}
                                        canRemove={productSlots.length > MIN_PRODUCTS}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Layout Selection */}
                    <Card>
                        <CardContent className="pt-6">
                            <LayoutSelector
                                value={layout}
                                onChange={setLayout}
                                disabled={isProcessing}
                            />
                        </CardContent>
                    </Card>

                    {/* Options Section */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Opcoes de Geracao</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <DescriptionSuggester
                                value={kitDescription}
                                onChange={setKitDescription}
                                images={getValidImages()}
                                disabled={isProcessing}
                            />

                            <StyleSelector
                                value={style}
                                onChange={(s) => setStyle(Array.isArray(s) ? s[0] : s)}
                                disabled={isProcessing}
                                idPrefix="multi-"
                                multiSelect={false}
                            />
                        </CardContent>
                    </Card>

                    {/* Generate Button */}
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            onClick={handleGenerate}
                            disabled={!canGenerateMultiple}
                            className="px-8"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Gerando Kit ({validImagesCount} produtos)...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Gerar Imagem de KIT ({validImagesCount} produtos)
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}

            {/* Progress */}
            {isProcessing && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Processando imagem de kit...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results Gallery */}
            {generatedImages.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5" />
                                    Resultados ({generatedImages.length} {generatedImages.length === 1 ? 'imagem' : 'imagens'})
                                </CardTitle>
                                <CardDescription>
                                    Imagens de kit geradas com sucesso
                                    {lastUsage && (
                                        <span className="ml-2 text-xs">
                                            • Ultimo custo: R$ {lastUsage.estimatedCostBRL.toFixed(4)}
                                        </span>
                                    )}
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearGallery}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Limpar Galeria
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Image Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {generatedImages.map((result) => (
                                <div
                                    key={result.timestamp}
                                    className="relative rounded-lg overflow-hidden border bg-muted group"
                                >
                                    <img
                                        src={result.image}
                                        alt={`Kit ${getStyleLabel(result.style)}`}
                                        className="w-full aspect-square object-contain"
                                    />
                                    {/* Style Badge */}
                                    <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium">
                                        {getStyleLabel(result.style)}
                                    </div>
                                    {/* Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleDownload(result)}
                                            className="bg-white text-black hover:bg-gray-100"
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleRemoveImage(result.timestamp)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bulk Actions */}
                        {generatedImages.length > 1 && (
                            <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
                                <Button onClick={handleDownloadAll} variant="default">
                                    <Package className="mr-2 h-4 w-4" />
                                    Download Todos (.zip)
                                </Button>
                                <Button onClick={handleClearGallery} variant="outline">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Gerar Outros
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default KitImageGenerator;
