import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDropzone } from 'react-dropzone';
import { Package2, Upload, X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductSlot as ProductSlotType } from '@/types/kit-generator';

interface ProductSlotProps {
    slot: ProductSlotType;
    index: number;
    totalSlots: number;
    onImageChange: (id: string, image: string | null) => void;
    onUrlChange: (id: string, url: string) => void;
    onRemove?: (id: string) => void;
    isProcessing: boolean;
    canRemove: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const ProductSlot = ({
    slot,
    index,
    totalSlots,
    onImageChange,
    onUrlChange,
    onRemove,
    isProcessing,
    canRemove
}: ProductSlotProps) => {
    const handleFileDrop = useCallback(async (files: File[]) => {
        if (files.length > 0) {
            try {
                const base64 = await fileToBase64(files[0]);
                onImageChange(slot.id, base64);
                onUrlChange(slot.id, '');
                toast.success(`Imagem ${index + 1} carregada`);
            } catch (error) {
                toast.error('Erro ao carregar imagem');
            }
        }
    }, [slot.id, index, onImageChange, onUrlChange]);

    const handleUrlApply = () => {
        if (!slot.url.trim()) {
            toast.error('Por favor, insira uma URL valida');
            return;
        }
        onImageChange(slot.id, slot.url);
        toast.success(`URL aplicada para produto ${index + 1}`);
    };

    const handleClear = () => {
        onImageChange(slot.id, null);
        onUrlChange(slot.id, '');
    };

    const dropzone = useDropzone({
        onDrop: handleFileDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxFiles: 1,
        disabled: isProcessing,
        noClick: false,
        noKeyboard: false,
        noDrag: false
    });

    return (
        <Card className="flex-1 min-w-[200px]">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        Produto {index + 1}
                    </span>
                    {canRemove && onRemove && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemove(slot.id)}
                            disabled={isProcessing}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {slot.image ? (
                    <div className="relative">
                        <img
                            src={slot.image}
                            alt={`Produto ${index + 1}`}
                            className="w-full h-32 object-contain rounded-lg border bg-muted"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={handleClear}
                            disabled={isProcessing}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div
                            {...dropzone.getRootProps()}
                            className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                transition-colors duration-200
                ${dropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                        >
                            <input {...dropzone.getInputProps()} />
                            <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                                Arraste ou clique
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex gap-1">
                    <Input
                        placeholder="URL da imagem..."
                        value={slot.url}
                        onChange={(e) => onUrlChange(slot.id, e.target.value)}
                        disabled={isProcessing || !!slot.image}
                        className="text-xs h-8"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={handleUrlApply}
                        disabled={isProcessing || !!slot.image || !slot.url.trim()}
                    >
                        <LinkIcon className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductSlot;
