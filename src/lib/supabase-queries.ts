/**
 * Supabase queries helper for legacy tables not yet in generated types.
 * Use (supabase as any) pattern for tables: hosted_images, ai_unified_results, 
 * produtos, marketing_templates, usuarios, user_api_keys, gemini_api_keys,
 * gemini_usage_logs, ad_model_configs, image_generation_queue, etc.
 */

import { supabase } from '@/integrations/supabase/client';

// Type-safe wrapper for legacy table queries
export const legacyDb = supabase as any;

// Re-export supabase for convenience
export { supabase };
