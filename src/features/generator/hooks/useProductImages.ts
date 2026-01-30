import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import type { ProductImage } from "../types";

/**
 * Convert file to base64 string
 */
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove prefix "data:image/...;base64," to send only pure base64
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function useProductImages(maxImages: number = 3) {
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => {
      productImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const onDropImages = useCallback(async (acceptedFiles: File[]) => {
    const filesToProcess = acceptedFiles.slice(0, maxImages - productImages.length);
    
    const newImages: ProductImage[] = [];
    
    for (const file of filesToProcess) {
      const preview = URL.createObjectURL(file);
      const base64 = await convertToBase64(file);
      newImages.push({ file, preview, base64 });
    }
    
    setProductImages(prev => [...prev, ...newImages].slice(0, maxImages));
    if (newImages.length > 0) {
      toast.success(`${newImages.length} imagem(ns) adicionada(s)`);
    }
  }, [productImages.length, maxImages]);

  const dropzoneConfig = useDropzone({
    onDrop: onDropImages,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp']
    },
    maxFiles: maxImages,
    disabled: productImages.length >= maxImages
  });

  const removeImage = useCallback((index: number) => {
    setProductImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  const clearImages = useCallback(() => {
    productImages.forEach(img => URL.revokeObjectURL(img.preview));
    setProductImages([]);
  }, [productImages]);

  return {
    productImages,
    setProductImages,
    removeImage,
    clearImages,
    dropzone: dropzoneConfig,
    isMaxImages: productImages.length >= maxImages,
  };
}
