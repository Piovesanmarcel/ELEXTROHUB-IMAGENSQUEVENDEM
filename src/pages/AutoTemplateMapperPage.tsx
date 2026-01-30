import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { TemplateUploadZone } from '@/components/admin/TemplateUploadZone';
import { AIAnalysisPanel } from '@/components/admin/AIAnalysisPanel';
import { ZonePreviewCanvas } from '@/components/admin/ZonePreviewCanvas';
import { SavedTemplatesList } from '@/components/admin/SavedTemplatesList';
import { TemplateMapper } from '@/components/admin/TemplateMapper';
import { useTemplateAIMapper } from '@/hooks/useTemplateAIMapper';
import { useMarketingTemplates } from '@/hooks/useMarketingTemplates';
import { useNavigate } from 'react-router-dom';
import type { TemplateConfig } from '@/types/marketing-templates';
import { toast } from 'sonner';

export default function AutoTemplateMapperPage() {
  const navigate = useNavigate();
  
  // Hook centralizado para sincronização
  const { templates, isLoading, reloadTemplates, updateTemplate, deleteTemplate } = useMarketingTemplates();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateKey, setTemplateKey] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Geral 01');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateConfig | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const {
    isAnalyzing,
    progress,
    currentStatus,
    analysisResult,
    error,
    uploadAndAnalyze,
    reset,
  } = useTemplateAIMapper();

  const generateTemplateDefaults = () => {
    const timestamp = Date.now();
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, 'h');
    
    setTemplateKey(`template-${timestamp}`);
    setTemplateName(`Template ${date} ${time}`);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    // Gerar automaticamente se campos estiverem vazios
    if (!templateKey || !templateName) {
      generateTemplateDefaults();
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !templateKey || !templateName) {
      return;
    }

    await uploadAndAnalyze(selectedFile, templateKey, templateName, selectedCategory);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTemplateKey('');
    setTemplateName('');
    setSelectedCategory('Geral 01');
    setPreviewUrl(null);
    reset();
  };

  const scrollToEditor = () => {
    editorRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  const handleEditTemplate = (template: TemplateConfig) => {
    console.log('📝 Carregando template para edição:', template.name);
    setEditingTemplate(template);
    
    setTimeout(() => {
      scrollToEditor();
    }, 100);
    
    toast.success(`Carregado: ${template.name}`);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    toast.info('Edição cancelada');
  };

  const canAnalyze = selectedFile && templateKey && templateName && !isAnalyzing;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mapeamento Automático de Templates</h1>
            <p className="text-muted-foreground">
              Faça upload do template e deixe a IA mapear todas as zonas visuais
            </p>
          </div>
        </div>

        {/* Templates Salvos */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Templates Salvos</h2>
          <SavedTemplatesList 
            templates={templates}
            isLoading={isLoading}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={deleteTemplate}
            onReload={reloadTemplates}
          />
        </Card>

        <Separator className="my-8" />

        {/* Editor Manual */}
        <div ref={editorRef}>
          <h2 className="text-2xl font-bold mb-4">
            {editingTemplate ? 'Editar Template' : 'Criar Template Manualmente'}
          </h2>
          <TemplateMapper 
            initialTemplate={editingTemplate}
            onCancel={handleCancelEdit}
            mode={editingTemplate ? 'edit' : 'create'}
            onSave={async (id, updates) => {
              const success = await updateTemplate(id, updates);
              if (success) {
                setEditingTemplate(null);
              }
              return success;
            }}
          />
        </div>

        <Separator className="my-8" />

        {/* Form */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Criar Novo Template com IA</h2>
          <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="templateKey">Template Key</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateTemplateDefaults}
                  disabled={isAnalyzing}
                  className="h-auto py-1 px-2 text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Gerar automaticamente
                </Button>
              </div>
              <Input
                id="templateKey"
                placeholder="Gerado automaticamente..."
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                disabled={isAnalyzing}
              />
              <p className="text-xs text-muted-foreground">
                Identificador único (gerado automaticamente ou personalize)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateName">Nome do Template</Label>
              <Input
                id="templateName"
                placeholder="Gerado automaticamente..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={isAnalyzing}
              />
              <p className="text-xs text-muted-foreground">
                Nome descritivo (gerado automaticamente ou personalize)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Geral 01">Geral 01</SelectItem>
                  <SelectItem value="Geral 02">Geral 02</SelectItem>
                  <SelectItem value="Brinquedos">Brinquedos</SelectItem>
                  <SelectItem value="Cafeteiras">Cafeteiras</SelectItem>
                  <SelectItem value="Utilidades">Utilidades</SelectItem>
                  <SelectItem value="Pet Shop">Pet Shop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TemplateUploadZone
            onFileSelect={handleFileSelect}
            disabled={isAnalyzing}
          />

          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="flex-1"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Mapear com IA Gemini
            </Button>

            {(analysisResult || error) && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isAnalyzing}
              >
                Novo Template
              </Button>
            )}
          </div>
        </Card>
        </div>

        {/* Analysis Panel */}
        <AIAnalysisPanel
          isAnalyzing={isAnalyzing}
          progress={progress}
          currentStatus={currentStatus}
          analysisResult={analysisResult}
          error={error}
        />

        {/* Zone Preview */}
        {analysisResult && previewUrl && (
          <ZonePreviewCanvas
            imageUrl={previewUrl}
            analysisResult={analysisResult}
          />
        )}
      </div>
    </div>
  );
}
