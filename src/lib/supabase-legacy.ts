/**
 * Supabase client wrapper for legacy tables not defined in auto-generated types.
 * Use this when querying tables that exist in the database but not in types.ts
 */
import { supabase } from '@/integrations/supabase/client';

// Type-safe wrapper that bypasses strict type checking for legacy tables
export const legacySupabase = supabase as any;

// Helper types for legacy tables
export interface HostedImage {
  id: string;
  url: string;
  tags?: string[];
  description?: string;
  original_filename?: string;
  uploaded_at?: string;
  r2_path?: string;
  product_id?: string;
  user_id?: string;
}

export interface AIUnifiedResult {
  id: string;
  product_id: string;
  user_id: string;
  results: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface GeminiUsageLog {
  id: string;
  user_id?: string;
  product_id?: string;
  operation_type: string;
  model_used?: string;
  prompt_tokens?: number;
  candidates_tokens?: number;
  total_tokens?: number;
  images_generated?: number;
  estimated_cost_usd?: number;
  estimated_cost_brl?: number;
  usd_to_brl_rate?: number;
  source?: string;
  api_key_id?: string;
  api_key_name?: string;
  created_at?: string;
}
