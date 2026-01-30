
export interface EnhancedImage {
  id?: string;
  original: string;
  enhanced: string;
  metadata?: {
    hosted?: boolean;
    hosting_service?: string;
    hosting_message?: string;
    enhanced_at?: string;
    hosted_at?: string;
    original_url?: string;
    original_deepai_url?: string;
    storage_path?: string;
    processor?: string;
    warning?: string;
    max_resolution?: string;
    resized_before_upload?: boolean;
    rate_limited?: boolean;
    fallback_used?: boolean;
    fallback_reason?: string;
    hosting_attempts?: number;
    processing_order?: number;
    guaranteed_success?: boolean;
  };
}

export interface ProcessImageResult {
  success: boolean;
  enhancedImage?: EnhancedImage;
  enhanced_url?: string;
  metadata?: any;
  error?: string;
  message?: string;
  shouldStop?: boolean;
  troubleshooting?: {
    issue: string;
    solution: string;
  };
  user_action_required?: string;
  dashboard_url?: string;
}
