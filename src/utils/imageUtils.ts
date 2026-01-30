
export const resizeImageToSquare = (imageUrl: string, targetSize: number = 1000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // Set canvas size to target square dimensions
      canvas.width = targetSize;
      canvas.height = targetSize;
      
      // Calculate scaling to maintain aspect ratio
      const scale = Math.max(targetSize / img.width, targetSize / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (targetSize - scaledWidth) / 2;
      const y = (targetSize - scaledHeight) / 2;
      
      // Fill background with white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetSize, targetSize);
      
      // Draw the scaled image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      // Convert to base64
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(resizedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};

export const uploadBase64Image = async (base64Data: string, filename: string): Promise<string> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, filename);
    
    // Upload to a temporary storage service (you might want to use Supabase storage)
    // For now, we'll return the base64 data as a placeholder
    return base64Data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
