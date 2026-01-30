// ============= GENERATOR FEATURE MODULE =============

// Types
export * from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils/textExtraction';

// Hooks
export { useWebhookStorage } from './hooks/useWebhookStorage';
export { useProductImages } from './hooks/useProductImages';
export { useParallelGeneration } from './hooks/useParallelGeneration';
export { useGeneratorExecution } from './hooks/useGeneratorExecution';

// Components - named exports
export { GeneratorHeader } from './components/GeneratorHeader';
export { WebhookConfigCard } from './components/WebhookConfigCard';
export { ProductInputCard } from './components/ProductInputCard';
export { StepTestCard } from './components/StepTestCard';
export { SceneTypeSelector } from './components/SceneTypeSelector';
export { ProgressTab } from './components/ProgressTab';
export { TratamentoTab } from './components/TratamentoTab';
export { ResultadosTab } from './components/ResultadosTab';

// Re-export ParallelProgress type
export type { ParallelProgress } from './types';
