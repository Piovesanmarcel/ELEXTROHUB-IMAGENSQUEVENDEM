import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TemplateConfig } from '@/types/marketing-templates';

// Type-safe wrapper for legacy tables
const legacyDb = supabase as any;

export const useMarketingTemplates = () => {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await legacyDb
        .from('marketing_templates')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        // Converter dados do Supabase para TemplateConfig
        // Filtrar templates internos (placeholder-reference) que são usados apenas no prompt da IA
        const parsedTemplates: TemplateConfig[] = data
          .filter((template: any) => !template.name.includes('placeholder-reference'))
          .map((template: any) => {
            // Priorizar colunas diretas, fallback para config JSONB (compatibilidade)
            const config = template.config || {};
            return {
              id: template.id,
              name: template.name,
              baseImage: template.base_image_url || config.base_image_url || template.thumbnail_url,
              dimensions: template.dimensions || config.dimensions || { width: 1080, height: 1080 },
              zones: template.zones || config.zones || [],
              category: template.category || 'Geral 01',
              colorScheme: template.color_scheme || config.color_scheme || null,
              disableGlobalLogo: template.disable_global_logo ?? config.disable_global_logo ?? false,
              displayOrder: template.display_order ?? config.display_order ?? 0,
            };
          });

        setTemplates(parsedTemplates);
        console.log(`✅ ${parsedTemplates.length} templates carregados do banco`);
      } else {
        setTemplates([]);
        console.log('ℹ️ Nenhum template encontrado no banco');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar templates';
      setError(errorMessage);
      console.error('❌ Erro ao carregar templates:', err);
      toast.error('Erro ao carregar templates do banco');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await legacyDb
        .from('marketing_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Template excluído com sucesso!');
      await loadTemplates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir template';
      toast.error(errorMessage);
      console.error('❌ Erro ao excluir template:', err);
      return false;
    }
  };

  const updateTemplate = async (templateId: string, updates: Partial<TemplateConfig>) => {
    try {
      // Usar colunas diretas (novo schema)
      const { error } = await legacyDb
        .from('marketing_templates')
        .update({
          name: updates.name,
          category: updates.category,
          base_image_url: updates.baseImage,
          dimensions: updates.dimensions,
          zones: updates.zones,
          color_scheme: updates.colorScheme,
          disable_global_logo: updates.disableGlobalLogo ?? false,
          display_order: updates.displayOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Template atualizado com sucesso!');
      await loadTemplates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar template';
      toast.error(errorMessage);
      console.error('❌ Erro ao atualizar template:', err);
      return false;
    }
  };

  // 🆕 Reordenar templates (salvar nova ordem no banco)
  const reorderTemplates = async (reorderedIds: string[]) => {
    try {
      // Atualizar cada template com sua nova posição usando coluna direta
      for (let i = 0; i < reorderedIds.length; i++) {
        const { error } = await legacyDb
          .from('marketing_templates')
          .update({ 
            display_order: i + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', reorderedIds[i]);
        
        if (error) throw error;
      }

      toast.success('Ordem dos templates atualizada!');
      await loadTemplates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar templates';
      toast.error(errorMessage);
      console.error('❌ Erro ao reordenar templates:', err);
      return false;
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    isLoading,
    error,
    reloadTemplates: loadTemplates,
    deleteTemplate,
    updateTemplate,
    reorderTemplates,
  };
};
