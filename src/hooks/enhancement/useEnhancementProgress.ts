
import { useState } from "react";

export const useEnhancementProgress = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const startProcessing = () => {
    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);
  };

  const updateProgress = (current: number, total: number) => {
    setProcessedCount(current);
    const newProgress = (current / total) * 100;
    setProgress(newProgress);
  };

  const finishProcessing = () => {
    setIsProcessing(false);
    setTimeout(() => {
      if (!isProcessing) {
        setProgress(0);
        setProcessedCount(0);
      }
    }, 3000);
  };

  return {
    isProcessing,
    progress,
    processedCount,
    startProcessing,
    updateProgress,
    finishProcessing
  };
};
