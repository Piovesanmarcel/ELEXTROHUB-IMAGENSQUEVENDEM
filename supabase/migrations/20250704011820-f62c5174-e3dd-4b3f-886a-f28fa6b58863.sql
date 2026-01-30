
-- Add a unique constraint on product_id and user_id to support the upsert operation
ALTER TABLE public.ai_unified_results 
ADD CONSTRAINT ai_unified_results_product_user_unique 
UNIQUE (product_id, user_id);
