/**
 * Legacy database types for tables that may not exist in the auto-generated Supabase types.
 * Use these with type assertions when querying tables not yet added to the schema.
 */

export interface HostedImage {
  id: string;
  url: string;
  tags?: string[];
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

export interface Produto {
  id: string;
  nome: string;
  sku?: string;
  bling_id?: string;
  enhanced_at?: string;
  usuario_id?: string;
  imagem_melhorada_1?: string;
  imagem_melhorada_2?: string;
  imagem_melhorada_3?: string;
  imagem_melhorada_4?: string;
  imagem_melhorada_5?: string;
  imagem_melhorada_6?: string;
  imagem_melhorada_7?: string;
  imagem_melhorada_8?: string;
  imagem_melhorada_9?: string;
  imagem_melhorada_10?: string;
}

export interface Usuario {
  id: string;
  bling_access_token?: string;
  bling_token_expires?: string;
}

export interface MarketingTemplate {
  id: string;
  category?: string;
  name?: string;
}

// Helper function to create typed supabase queries for legacy tables
export function legacyQuery<T>(supabase: any) {
  return {
    from: (table: string) => supabase.from(table) as {
      select: (columns?: string) => Promise<{ data: T[] | null; error: any }>;
      insert: (data: Partial<T> | Partial<T>[]) => Promise<{ data: T | null; error: any }>;
      update: (data: Partial<T>) => { eq: (col: string, val: any) => Promise<{ data: T | null; error: any }> };
      delete: () => { eq: (col: string, val: any) => Promise<{ error: any }> };
    }
  };
}
