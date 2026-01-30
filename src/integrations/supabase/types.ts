export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ad_model_configs: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_unified_results: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_sku: string | null
          results: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_sku?: string | null
          results: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_sku?: string | null
          results?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          model_used: string | null
          operation_type: string
          success: boolean | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          model_used?: string | null
          operation_type: string
          success?: boolean | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          model_used?: string | null
          operation_type?: string
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      authorized_jobs: {
        Row: {
          created_at: string | null
          expected_images: number | null
          expires_at: string | null
          id: string
          job_id: string
          metadata: Json | null
          received_images: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expected_images?: number | null
          expires_at?: string | null
          id?: string
          job_id: string
          metadata?: Json | null
          received_images?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expected_images?: number | null
          expires_at?: string | null
          id?: string
          job_id?: string
          metadata?: Json | null
          received_images?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          created_at: string | null
          id: string
          paused: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          paused?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          paused?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bling: {
        Row: {
          bling_access_token: string | null
          bling_refresh_token: string | null
          bling_token_expires: string | null
          id: number
        }
        Insert: {
          bling_access_token?: string | null
          bling_refresh_token?: string | null
          bling_token_expires?: string | null
          id?: number
        }
        Update: {
          bling_access_token?: string | null
          bling_refresh_token?: string | null
          bling_token_expires?: string | null
          id?: number
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          created_at: string | null
          id: string
          logo_position: string | null
          logo_size: number | null
          logo_url: string | null
          show_logo_on_templates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_position?: string | null
          logo_size?: number | null
          logo_url?: string | null
          show_logo_on_templates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_position?: string | null
          logo_size?: number | null
          logo_url?: string | null
          show_logo_on_templates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          created_at: string | null
          credits_purchased: number
          id: string
          payment_method: string | null
          price_paid: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_purchased: number
          id?: string
          payment_method?: string | null
          price_paid: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_purchased?: number
          id?: string
          payment_method?: string | null
          price_paid?: number
          user_id?: string
        }
        Relationships: []
      }
      credit_reservations: {
        Row: {
          confirmed_at: string | null
          credits_reserved: number
          expires_at: string
          id: string
          job_id: string | null
          metadata: Json | null
          operation_type: string
          refunded_at: string | null
          reserved_at: string
          scene_type: string | null
          status: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          credits_reserved?: number
          expires_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          operation_type?: string
          refunded_at?: string | null
          reserved_at?: string
          scene_type?: string | null
          status?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          credits_reserved?: number
          expires_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          operation_type?: string
          refunded_at?: string | null
          reserved_at?: string
          scene_type?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_usage: {
        Row: {
          created_at: string | null
          credits_spent: number
          id: string
          operation_details: Json | null
          operation_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_spent?: number
          id?: string
          operation_details?: Json | null
          operation_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_spent?: number
          id?: string
          operation_details?: Json | null
          operation_type?: string
          user_id?: string
        }
        Relationships: []
      }
      enhancement_packages: {
        Row: {
          created_at: string
          enhancements_added: number
          id: string
          package_type: string
          payment_status: string
          price_brl: number
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enhancements_added?: number
          id?: string
          package_type?: string
          payment_status?: string
          price_brl?: number
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enhancements_added?: number
          id?: string
          package_type?: string
          payment_status?: string
          price_brl?: number
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gemini_api_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string | null
          exhausted_at: string | null
          id: string
          is_active: boolean | null
          is_exhausted: boolean | null
          last_used_at: string | null
          name: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string | null
          exhausted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_exhausted?: boolean | null
          last_used_at?: string | null
          name: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string | null
          exhausted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_exhausted?: boolean | null
          last_used_at?: string | null
          name?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      gemini_usage_logs: {
        Row: {
          api_key_id: string | null
          api_key_name: string | null
          candidates_tokens: number | null
          created_at: string | null
          estimated_cost_brl: number | null
          estimated_cost_usd: number | null
          id: string
          image_resolution: string | null
          images_generated: number | null
          model_used: string
          operation_type: string
          product_id: string | null
          prompt_tokens: number | null
          source: string | null
          total_tokens: number | null
          usd_to_brl_rate: number | null
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          api_key_name?: string | null
          candidates_tokens?: number | null
          created_at?: string | null
          estimated_cost_brl?: number | null
          estimated_cost_usd?: number | null
          id?: string
          image_resolution?: string | null
          images_generated?: number | null
          model_used: string
          operation_type: string
          product_id?: string | null
          prompt_tokens?: number | null
          source?: string | null
          total_tokens?: number | null
          usd_to_brl_rate?: number | null
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          api_key_name?: string | null
          candidates_tokens?: number | null
          created_at?: string | null
          estimated_cost_brl?: number | null
          estimated_cost_usd?: number | null
          id?: string
          image_resolution?: string | null
          images_generated?: number | null
          model_used?: string
          operation_type?: string
          product_id?: string | null
          prompt_tokens?: number | null
          source?: string | null
          total_tokens?: number | null
          usd_to_brl_rate?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gemini_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "gemini_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemini_usage_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_metrics: {
        Row: {
          created_at: string | null
          error_message: string | null
          estimated_cost_brl: number | null
          estimated_cost_usd: number | null
          generation_type: string
          id: string
          job_id: string | null
          model_used: string | null
          processing_time_ms: number | null
          queue_wait_time_ms: number | null
          success: boolean | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          estimated_cost_brl?: number | null
          estimated_cost_usd?: number | null
          generation_type: string
          id?: string
          job_id?: string | null
          model_used?: string | null
          processing_time_ms?: number | null
          queue_wait_time_ms?: number | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          estimated_cost_brl?: number | null
          estimated_cost_usd?: number | null
          generation_type?: string
          id?: string
          job_id?: string | null
          model_used?: string | null
          processing_time_ms?: number | null
          queue_wait_time_ms?: number | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      hosted_images: {
        Row: {
          description: string | null
          file_size: number
          file_type: string
          filename: string
          height: number | null
          id: string
          is_public: boolean
          original_filename: string
          product_id: string | null
          r2_path: string
          tags: string[] | null
          template_id: string | null
          uploaded_at: string
          url: string
          user_id: string
          width: number | null
        }
        Insert: {
          description?: string | null
          file_size: number
          file_type: string
          filename: string
          height?: number | null
          id?: string
          is_public?: boolean
          original_filename: string
          product_id?: string | null
          r2_path: string
          tags?: string[] | null
          template_id?: string | null
          uploaded_at?: string
          url: string
          user_id: string
          width?: number | null
        }
        Update: {
          description?: string | null
          file_size?: number
          file_type?: string
          filename?: string
          height?: number | null
          id?: string
          is_public?: boolean
          original_filename?: string
          product_id?: string | null
          r2_path?: string
          tags?: string[] | null
          template_id?: string | null
          uploaded_at?: string
          url?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hosted_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosted_images_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketing_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosted_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_plans: {
        Row: {
          created_at: string
          description: string
          features: Json
          id: string
          is_active: boolean
          max_images: number
          max_storage_gb: number
          name: string
          price_monthly: number
        }
        Insert: {
          created_at?: string
          description: string
          features?: Json
          id?: string
          is_active?: boolean
          max_images: number
          max_storage_gb: number
          name: string
          price_monthly: number
        }
        Update: {
          created_at?: string
          description?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_images?: number
          max_storage_gb?: number
          name?: string
          price_monthly?: number
        }
        Relationships: []
      }
      image_generation_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          credits_debited: boolean | null
          error_message: string | null
          generation_type: string
          id: string
          input_data: Json
          locked_at: string | null
          priority: number | null
          processing_time_ms: number | null
          queue_wait_time_ms: number | null
          result: Json | null
          retry_count: number | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          credits_debited?: boolean | null
          error_message?: string | null
          generation_type: string
          id?: string
          input_data: Json
          locked_at?: string | null
          priority?: number | null
          processing_time_ms?: number | null
          queue_wait_time_ms?: number | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          credits_debited?: boolean | null
          error_message?: string | null
          generation_type?: string
          id?: string
          input_data?: Json
          locked_at?: string | null
          priority?: number | null
          processing_time_ms?: number | null
          queue_wait_time_ms?: number | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_templates: {
        Row: {
          base_image_url: string
          category: string | null
          color_scheme: Json | null
          created_at: string
          detected_fonts: string[] | null
          dimensions: Json
          disable_global_logo: boolean | null
          display_order: number | null
          id: string
          is_priority: boolean | null
          name: string
          template_key: string
          updated_at: string
          zones: Json
        }
        Insert: {
          base_image_url: string
          category?: string | null
          color_scheme?: Json | null
          created_at?: string
          detected_fonts?: string[] | null
          dimensions?: Json
          disable_global_logo?: boolean | null
          display_order?: number | null
          id?: string
          is_priority?: boolean | null
          name: string
          template_key: string
          updated_at?: string
          zones?: Json
        }
        Update: {
          base_image_url?: string
          category?: string | null
          color_scheme?: Json | null
          created_at?: string
          detected_fonts?: string[] | null
          dimensions?: Json
          disable_global_logo?: boolean | null
          display_order?: number | null
          id?: string
          is_priority?: boolean | null
          name?: string
          template_key?: string
          updated_at?: string
          zones?: Json
        }
        Relationships: []
      }
      marketplace_integrations: {
        Row: {
          access_token: string | null
          app_id: string | null
          ativo: boolean
          atualizado_em: string
          client_id: string | null
          client_secret: string | null
          configuracoes: Json | null
          criado_em: string
          expires_in: number | null
          id: string
          marketplace: string
          refresh_token: string | null
          rotation_required: boolean | null
          seller_id: string | null
          token_created_at: string | null
          token_expires_at: string | null
          token_rotated_at: string | null
          usuario_id: string
          uuid: string | null
        }
        Insert: {
          access_token?: string | null
          app_id?: string | null
          ativo?: boolean
          atualizado_em?: string
          client_id?: string | null
          client_secret?: string | null
          configuracoes?: Json | null
          criado_em?: string
          expires_in?: number | null
          id?: string
          marketplace: string
          refresh_token?: string | null
          rotation_required?: boolean | null
          seller_id?: string | null
          token_created_at?: string | null
          token_expires_at?: string | null
          token_rotated_at?: string | null
          usuario_id: string
          uuid?: string | null
        }
        Update: {
          access_token?: string | null
          app_id?: string | null
          ativo?: boolean
          atualizado_em?: string
          client_id?: string | null
          client_secret?: string | null
          configuracoes?: Json | null
          criado_em?: string
          expires_in?: number | null
          id?: string
          marketplace?: string
          refresh_token?: string | null
          rotation_required?: boolean | null
          seller_id?: string | null
          token_created_at?: string | null
          token_expires_at?: string | null
          token_rotated_at?: string | null
          usuario_id?: string
          uuid?: string | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          atualizado_em: string
          categoria_marketplace: string | null
          condicao: string | null
          criado_em: string
          estoque: number | null
          id: string
          marketplace_integration_id: string
          marketplace_listing_id: string
          preco: number | null
          produto_id: string
          sincronizado_em: string | null
          status: string | null
          titulo: string | null
        }
        Insert: {
          atualizado_em?: string
          categoria_marketplace?: string | null
          condicao?: string | null
          criado_em?: string
          estoque?: number | null
          id?: string
          marketplace_integration_id: string
          marketplace_listing_id: string
          preco?: number | null
          produto_id: string
          sincronizado_em?: string | null
          status?: string | null
          titulo?: string | null
        }
        Update: {
          atualizado_em?: string
          categoria_marketplace?: string | null
          condicao?: string | null
          criado_em?: string
          estoque?: number | null
          id?: string
          marketplace_integration_id?: string
          marketplace_listing_id?: string
          preco?: number | null
          produto_id?: string
          sincronizado_em?: string | null
          status?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_marketplace_integration_id_fkey"
            columns: ["marketplace_integration_id"]
            isOneToOne: false
            referencedRelation: "marketplace_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_marketplace_integration_id_fkey"
            columns: ["marketplace_integration_id"]
            isOneToOne: false
            referencedRelation: "marketplace_integrations_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          atualizado_em: string
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          criado_em: string
          data_pedido: string
          id: string
          items: Json
          marketplace: string
          marketplace_integration_id: string
          marketplace_order_id: string
          payment_method: string | null
          processado: boolean | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string
          total: number
        }
        Insert: {
          atualizado_em?: string
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          criado_em?: string
          data_pedido: string
          id?: string
          items: Json
          marketplace: string
          marketplace_integration_id: string
          marketplace_order_id: string
          payment_method?: string | null
          processado?: boolean | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status: string
          total: number
        }
        Update: {
          atualizado_em?: string
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          criado_em?: string
          data_pedido?: string
          id?: string
          items?: Json
          marketplace?: string
          marketplace_integration_id?: string
          marketplace_order_id?: string
          payment_method?: string | null
          processado?: boolean | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_marketplace_integration_id_fkey"
            columns: ["marketplace_integration_id"]
            isOneToOne: false
            referencedRelation: "marketplace_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_marketplace_integration_id_fkey"
            columns: ["marketplace_integration_id"]
            isOneToOne: false
            referencedRelation: "marketplace_integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_generation_logs: {
        Row: {
          attempts: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          image_url: string | null
          n8n_node_config: Json | null
          product_name: string
          request_payload: Json | null
          response_data: Json | null
          scene_type: string
          status: string | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          n8n_node_config?: Json | null
          product_name: string
          request_payload?: Json | null
          response_data?: Json | null
          scene_type: string
          status?: string | null
          user_id: string
          webhook_url: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          n8n_node_config?: Json | null
          product_name?: string
          request_payload?: Json | null
          response_data?: Json | null
          scene_type?: string
          status?: string | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          bling_id: string | null
          canal_venda: string | null
          cliente: string
          criado_em: string
          data_bling: string | null
          frete: number | null
          id: string
          loja: string | null
          numero: string
          status: string
          total: number
          usuario_id: string
        }
        Insert: {
          bling_id?: string | null
          canal_venda?: string | null
          cliente: string
          criado_em?: string
          data_bling?: string | null
          frete?: number | null
          id?: string
          loja?: string | null
          numero: string
          status?: string
          total?: number
          usuario_id: string
        }
        Update: {
          bling_id?: string | null
          canal_venda?: string | null
          cliente?: string
          criado_em?: string
          data_bling?: string | null
          frete?: number | null
          id?: string
          loja?: string | null
          numero?: string
          status?: string
          total?: number
          usuario_id?: string
        }
        Relationships: []
      }
      pedidos_itens: {
        Row: {
          criado_em: string
          descricao: string
          id: string
          pedido_id: string
          preco_total: number
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          sku: string | null
        }
        Insert: {
          criado_em?: string
          descricao: string
          id?: string
          pedido_id: string
          preco_total?: number
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          sku?: string | null
        }
        Update: {
          criado_em?: string
          descricao?: string
          id?: string
          pedido_id?: string
          preco_total?: number
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_callbacks: {
        Row: {
          callback_hash: string
          created_at: string | null
          id: string
          job_id: string
          template_id: string
          user_id: string | null
        }
        Insert: {
          callback_hash: string
          created_at?: string | null
          id?: string
          job_id: string
          template_id: string
          user_id?: string | null
        }
        Update: {
          callback_hash?: string
          created_at?: string | null
          id?: string
          job_id?: string
          template_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          altura: number | null
          atualizado_em: string | null
          bling_id: string | null
          categoria: string | null
          codigo_fornecedor: string | null
          descricao: string | null
          descricao_curta: string | null
          enhanced_at: string | null
          estoque: number | null
          estoque_sincronizado_de: string | null
          estoque_sincronizado_em: string | null
          grupo_replicacao: string | null
          gtin: string | null
          id: string
          imagem_melhorada_1: string | null
          imagem_melhorada_10: string | null
          imagem_melhorada_2: string | null
          imagem_melhorada_3: string | null
          imagem_melhorada_4: string | null
          imagem_melhorada_5: string | null
          imagem_melhorada_6: string | null
          imagem_melhorada_7: string | null
          imagem_melhorada_8: string | null
          imagem_melhorada_9: string | null
          imagem_url: string | null
          imagem_url_10: string | null
          imagem_url_2: string | null
          imagem_url_3: string | null
          imagem_url_4: string | null
          imagem_url_5: string | null
          imagem_url_6: string | null
          imagem_url_7: string | null
          imagem_url_8: string | null
          imagem_url_9: string | null
          largura: number | null
          marca: string | null
          nome: string
          nome_fornecedor: string | null
          peso_bruto: number | null
          preco: number | null
          preco_custo: number | null
          profundidade: number | null
          ready_for_ads: boolean | null
          situacao: string | null
          sku: string
          sku_pai: string | null
          tipo_produto: string | null
          unidade: string | null
          usuario_id: string | null
          variacoes: Json | null
        }
        Insert: {
          altura?: number | null
          atualizado_em?: string | null
          bling_id?: string | null
          categoria?: string | null
          codigo_fornecedor?: string | null
          descricao?: string | null
          descricao_curta?: string | null
          enhanced_at?: string | null
          estoque?: number | null
          estoque_sincronizado_de?: string | null
          estoque_sincronizado_em?: string | null
          grupo_replicacao?: string | null
          gtin?: string | null
          id?: string
          imagem_melhorada_1?: string | null
          imagem_melhorada_10?: string | null
          imagem_melhorada_2?: string | null
          imagem_melhorada_3?: string | null
          imagem_melhorada_4?: string | null
          imagem_melhorada_5?: string | null
          imagem_melhorada_6?: string | null
          imagem_melhorada_7?: string | null
          imagem_melhorada_8?: string | null
          imagem_melhorada_9?: string | null
          imagem_url?: string | null
          imagem_url_10?: string | null
          imagem_url_2?: string | null
          imagem_url_3?: string | null
          imagem_url_4?: string | null
          imagem_url_5?: string | null
          imagem_url_6?: string | null
          imagem_url_7?: string | null
          imagem_url_8?: string | null
          imagem_url_9?: string | null
          largura?: number | null
          marca?: string | null
          nome: string
          nome_fornecedor?: string | null
          peso_bruto?: number | null
          preco?: number | null
          preco_custo?: number | null
          profundidade?: number | null
          ready_for_ads?: boolean | null
          situacao?: string | null
          sku: string
          sku_pai?: string | null
          tipo_produto?: string | null
          unidade?: string | null
          usuario_id?: string | null
          variacoes?: Json | null
        }
        Update: {
          altura?: number | null
          atualizado_em?: string | null
          bling_id?: string | null
          categoria?: string | null
          codigo_fornecedor?: string | null
          descricao?: string | null
          descricao_curta?: string | null
          enhanced_at?: string | null
          estoque?: number | null
          estoque_sincronizado_de?: string | null
          estoque_sincronizado_em?: string | null
          grupo_replicacao?: string | null
          gtin?: string | null
          id?: string
          imagem_melhorada_1?: string | null
          imagem_melhorada_10?: string | null
          imagem_melhorada_2?: string | null
          imagem_melhorada_3?: string | null
          imagem_melhorada_4?: string | null
          imagem_melhorada_5?: string | null
          imagem_melhorada_6?: string | null
          imagem_melhorada_7?: string | null
          imagem_melhorada_8?: string | null
          imagem_melhorada_9?: string | null
          imagem_url?: string | null
          imagem_url_10?: string | null
          imagem_url_2?: string | null
          imagem_url_3?: string | null
          imagem_url_4?: string | null
          imagem_url_5?: string | null
          imagem_url_6?: string | null
          imagem_url_7?: string | null
          imagem_url_8?: string | null
          imagem_url_9?: string | null
          largura?: number | null
          marca?: string | null
          nome?: string
          nome_fornecedor?: string | null
          peso_bruto?: number | null
          preco?: number | null
          preco_custo?: number | null
          profundidade?: number | null
          ready_for_ads?: boolean | null
          situacao?: string | null
          sku?: string
          sku_pai?: string | null
          tipo_produto?: string | null
          unidade?: string | null
          usuario_id?: string | null
          variacoes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_sync_state: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          current_page: number
          erro_msg: string | null
          id: string
          last_synced_at: string | null
          status: string
          total_pages: number | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          current_page?: number
          erro_msg?: string | null
          id?: string
          last_synced_at?: string | null
          status?: string
          total_pages?: number | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          current_page?: number
          erro_msg?: string | null
          id?: string
          last_synced_at?: string | null
          status?: string
          total_pages?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_sync_state_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          user_id: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          user_id: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          user_id?: string
          uses_count?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          conversion_date: string | null
          created_at: string
          credits_awarded: number | null
          id: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          status: string
        }
        Insert: {
          conversion_date?: string | null
          created_at?: string
          credits_awarded?: number | null
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          status?: string
        }
        Update: {
          conversion_date?: string | null
          created_at?: string
          credits_awarded?: number | null
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_user_id?: string
          status?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          criado_em: string
          detalhes: Json | null
          id: string
          status: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          detalhes?: Json | null
          id?: string
          status: string
          tipo: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          detalhes?: Json | null
          id?: string
          status?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      sync_schedule_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          products_synced: number | null
          started_at: string | null
          status: string
          usuario_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          products_synced?: number | null
          started_at?: string | null
          status?: string
          usuario_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          products_synced?: number | null
          started_at?: string | null
          status?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_schedule_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      token_security_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          marketplace: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          marketplace: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          marketplace?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      tokens: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string | null
          expires_in: number | null
          id: string
          refresh_token: string | null
          token_type: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email?: string | null
          expires_in?: number | null
          id?: string
          refresh_token?: string | null
          token_type?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string | null
          expires_in?: number | null
          id?: string
          refresh_token?: string | null
          token_type?: string | null
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string | null
          exhausted_at: string | null
          id: string
          is_active: boolean | null
          is_exhausted: boolean | null
          last_used_at: string | null
          name: string
          provider: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string | null
          exhausted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_exhausted?: boolean | null
          last_used_at?: string | null
          name: string
          provider: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string | null
          exhausted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_exhausted?: boolean | null
          last_used_at?: string | null
          name?: string
          provider?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits_balance: number | null
          credits_used: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_balance?: number | null
          credits_used?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_balance?: number | null
          credits_used?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_enhancement_usage: {
        Row: {
          created_at: string
          enhancements_available: number
          enhancements_used: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enhancements_available?: number
          enhancements_used?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enhancements_available?: number
          enhancements_used?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          billing_cycle_start: string | null
          created_at: string | null
          credits_used_this_month: number | null
          id: string
          max_concurrent_jobs: number | null
          monthly_credits: number | null
          plan_type: string | null
          queue_priority: number | null
          user_id: string
        }
        Insert: {
          billing_cycle_start?: string | null
          created_at?: string | null
          credits_used_this_month?: number | null
          id?: string
          max_concurrent_jobs?: number | null
          monthly_credits?: number | null
          plan_type?: string | null
          queue_priority?: number | null
          user_id: string
        }
        Update: {
          billing_cycle_start?: string | null
          created_at?: string | null
          credits_used_this_month?: number | null
          id?: string
          max_concurrent_jobs?: number | null
          monthly_credits?: number | null
          plan_type?: string | null
          queue_priority?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          images_uploaded: number
          plan_id: string | null
          storage_used_gb: number
          subscription_expires_at: string | null
          subscription_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          images_uploaded?: number
          plan_id?: string | null
          storage_used_gb?: number
          subscription_expires_at?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          images_uploaded?: number
          plan_id?: string | null
          storage_used_gb?: number
          subscription_expires_at?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "hosting_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          bling_access_token: string | null
          bling_email: string | null
          bling_refresh_token: string | null
          bling_token_expires: string | null
          email: string | null
          id: string
          marca: string | null
          nome: string | null
          sync_automatica: boolean | null
          ultima_sincronizacao: string | null
          webhook_configurado: boolean | null
        }
        Insert: {
          bling_access_token?: string | null
          bling_email?: string | null
          bling_refresh_token?: string | null
          bling_token_expires?: string | null
          email?: string | null
          id?: string
          marca?: string | null
          nome?: string | null
          sync_automatica?: boolean | null
          ultima_sincronizacao?: string | null
          webhook_configurado?: boolean | null
        }
        Update: {
          bling_access_token?: string | null
          bling_email?: string | null
          bling_refresh_token?: string | null
          bling_token_expires?: string | null
          email?: string | null
          id?: string
          marca?: string | null
          nome?: string | null
          sync_automatica?: boolean | null
          ultima_sincronizacao?: string | null
          webhook_configurado?: boolean | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          criado_em: string
          dados: Json
          evento: string
          id: string
          processado: boolean | null
        }
        Insert: {
          criado_em?: string
          dados: Json
          evento: string
          id?: string
          processado?: boolean | null
        }
        Update: {
          criado_em?: string
          dados?: Json
          evento?: string
          id?: string
          processado?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      marketplace_integrations_safe: {
        Row: {
          access_token_masked: string | null
          ativo: boolean | null
          atualizado_em: string | null
          client_id: string | null
          client_secret_masked: string | null
          configuracoes: Json | null
          criado_em: string | null
          days_until_rotation: number | null
          id: string | null
          marketplace: string | null
          refresh_token_masked: string | null
          rotation_required: boolean | null
          seller_id: string | null
          token_created_at: string | null
          token_expires_at: string | null
          token_rotated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          access_token_masked?: never
          ativo?: boolean | null
          atualizado_em?: string | null
          client_id?: string | null
          client_secret_masked?: never
          configuracoes?: Json | null
          criado_em?: string | null
          days_until_rotation?: never
          id?: string | null
          marketplace?: string | null
          refresh_token_masked?: never
          rotation_required?: boolean | null
          seller_id?: string | null
          token_created_at?: string | null
          token_expires_at?: string | null
          token_rotated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          access_token_masked?: never
          ativo?: boolean | null
          atualizado_em?: string | null
          client_id?: string | null
          client_secret_masked?: never
          configuracoes?: Json | null
          criado_em?: string | null
          days_until_rotation?: never
          id?: string | null
          marketplace?: string | null
          refresh_token_masked?: never
          rotation_required?: boolean | null
          seller_id?: string | null
          token_created_at?: string | null
          token_expires_at?: string | null
          token_rotated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      acquire_queue_jobs: {
        Args: { p_batch_size?: number }
        Returns: {
          completed_at: string | null
          created_at: string | null
          credits_debited: boolean | null
          error_message: string | null
          generation_type: string
          id: string
          input_data: Json
          locked_at: string | null
          priority: number | null
          processing_time_ms: number | null
          queue_wait_time_ms: number | null
          result: Json | null
          retry_count: number | null
          started_at: string | null
          status: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "image_generation_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      add_enhancement_package: {
        Args: {
          p_enhancements_to_add?: number
          p_package_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_and_reset_sync_states: { Args: never; Returns: undefined }
      check_token_rotation_required: { Args: never; Returns: undefined }
      check_user_queue_limits: {
        Args: { p_user_id: string }
        Returns: {
          can_enqueue: boolean
          cooldown_remaining_seconds: number
          credits_remaining: number
          max_concurrent: number
          pending_jobs: number
          queue_priority: number
          reason: string
        }[]
      }
      cleanup_expired_reservations: { Args: never; Returns: number }
      confirm_credit_admin: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      confirm_credit_reservation: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      debit_generation_credit:
        | { Args: { p_amount?: number }; Returns: boolean }
        | { Args: { p_amount: number; p_user_id: string }; Returns: undefined }
      debit_generation_credit_admin: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: boolean
      }
      decrypt_token: {
        Args: { encrypted_token: string; key?: string }
        Returns: string
      }
      encrypt_token: { Args: { key?: string; token: string }; Returns: string }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      get_user_queue_priority: { Args: { p_user_id: string }; Returns: number }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      log_token_access: {
        Args: {
          p_action: string
          p_ip_address?: string
          p_marketplace: string
          p_user_agent?: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      process_referral_conversion: {
        Args: { p_package_id: string; p_referred_user_id: string }
        Returns: boolean
      }
      refund_credit_admin: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      refund_credit_reservation: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      register_referral: {
        Args: { p_referral_code: string; p_referred_user_id: string }
        Returns: boolean
      }
      reserve_credit_admin: {
        Args: {
          p_amount?: number
          p_job_id?: string
          p_operation_type?: string
          p_scene_type?: string
          p_user_id: string
        }
        Returns: string
      }
      reserve_generation_credit: {
        Args: {
          p_amount?: number
          p_metadata?: Json
          p_operation_type?: string
          p_scene_type?: string
        }
        Returns: string
      }
      reset_exhausted_gemini_keys: { Args: never; Returns: undefined }
      reset_old_done_sync_states: { Args: never; Returns: number }
      reset_stuck_jobs: {
        Args: { p_max_retries?: number; p_timeout_minutes?: number }
        Returns: number
      }
      reset_stuck_sync_states: { Args: never; Returns: number }
      secure_marketplace_access: {
        Args: {
          integration_row: Database["public"]["Tables"]["marketplace_integrations"]["Row"]
        }
        Returns: boolean
      }
      use_enhancement_credit: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
