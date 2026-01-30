
export interface EnhancementRequest {
  imageUrl?: string;
  imageData?: string;
  enhancement_type?: string;
}

export interface EnhancementResult {
  success: boolean;
  error?: string;
  message?: string;
  original_url: string | null;
  enhanced_url: string | null;
  enhancement_type?: string;
  processing_time?: string;
  metadata?: {
    resolution?: string;
    format?: string;
    size?: string;
    note?: string;
    processor?: string;
    deepai_id?: string;
    max_resolution?: string;
    optimization?: string;
    fallback_used?: boolean;
  };
  user_action_required?: string;
  dashboard_url?: string;
  troubleshooting?: {
    issue: string;
    solution: string;
    steps: string[];
  };
  debug_info?: {
    status?: number;
    statusText?: string;
    apiKeyPrefix?: string;
    endpoint?: string;
    timestamp?: string;
    fullError?: any;
    errorType?: string;
  };
}

export interface ImageDimensions {
  width: number;
  height: number;
}
