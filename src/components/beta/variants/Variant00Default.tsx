
import {
    Sparkles, Rocket, Cpu, Check, Settings, Play, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, ChevronRight, Lock, Eye, RefreshCw,
    Package, DollarSign, Weight, Tag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { AdvancedPricingSimulator } from "@/pages/AdvancedPricingSimulator";
import { ElectroHubLogo } from "@/components/ElectroHubLogo";
import { useMagicStudioController } from "@/hooks/useMagicStudioController";

interface VariantProps {
    state: ReturnType<typeof useMagicStudioController>['state'];
    actions: ReturnType<typeof useMagicStudioController>['actions'];
}

// ===== UI COMPONENTS for Default Variant =====
const AgentCard = ({
    name,
    role,
    icon: Icon,
    status,
    color,
    progress
}: {
    name: string;
    role: string;
    icon: any;
    status: 'idle' | 'running' | 'success' | 'error';
    color: string;
    progress?: string;
}) => (
    <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-500 ${status === 'running' ? `border-${color}-500 shadow-lg shadow-${color}-500/20 bg-white` :
        status === 'success' ? `border-green-500 bg-green-50/50` :
            'border-slate-100 bg-slate-50/50 grayscale opacity-70'
        }`}>
        {status === 'running' && (
            <div className={`absolute top-0 left-0 w-full h-1 bg-${color}-100`}>
                <div className={`h-full bg-${color}-500 animate-progress-indeterminate`} />
            </div>
        )}
        <div className="p-6 flex items-start gap-4">
            <div className={`p-3 rounded-lg ${status === 'running' || status === 'success' ? `bg-${color}-100 text-${color}-600` : 'bg-slate-200 text-slate-500'
                }`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-lg text-slate-800">{name}</h3>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{role}</p>

                <div className="mt-3 flex items-center gap-2">
                    {status === 'idle' && <Badge variant="outline" className="text-xs">Aguardando</Badge>}
                    {status === 'running' && (
                        <Badge variant="secondary" className={`bg-${color}-100 text-${color}-700 animate-pulse`}>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Processando...
                        </Badge>
                    )}
                    {status === 'success' && <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluído</Badge>}
                    {status === 'error' && <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Erro</Badge>}
                </div>

                {progress && <p className="text-xs text-slate-400 mt-2">{progress}</p>}
            </div>
        </div>
    </div>
);

export function Variant00Default({ state, actions }: VariantProps) {
    const {
        productImages, referenceImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning, steps,
        unifiedCommandsData, copywritingData, geminiImages, kitImages
    } = state;

    const {
        setProductImages, setReferenceImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    return (
        <>
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-tr from-purple-600 to-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-purple-200 transition-transform hover:scale-105 cursor-default">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-blue-700 tracking-tight">
                                Magic Studio
                            </h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Inteligência de Vendas</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Dialog open={showSettings} onOpenChange={setShowSettings}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Configurações do Studio</DialogTitle>
                                    <DialogDescription>Gerencie conexões e webhooks dos agentes.</DialogDescription>
                                </DialogHeader>
                                <div className="max-h-[60vh] overflow-y-auto pr-2">
                                    <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button
                            className="rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 px-6 h-10 border border-slate-700"
                            onClick={handleNewProject}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Novo Projeto
                        </Button>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-[1800px] mx-auto px-6 py-8">
                {/* HERO */}
                <div className="text-center mb-12 space-y-6 pt-8">
                    <div className="flex justify-center mb-6">
                        <div className="scale-125 transform transition-transform duration-700 hover:scale-150">
                            <ElectroHubLogo size="lg" showText={false} />
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="bg-white border p-1.5 rounded-full shadow-sm">
                            <TabsTrigger value="input" className="rounded-full px-8 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">Input</TabsTrigger>
                            <TabsTrigger value="process" className="rounded-full px-8 py-2.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all" disabled={!isAutomationRunning && activeTab === 'input'}>Agents</TabsTrigger>
                            <TabsTrigger value="results" className="rounded-full px-8 py-2.5 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all" disabled={productImages.length === 0}>Gallery</TabsTrigger>
                            <TabsTrigger value="pricing" className="rounded-full px-8 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all" disabled={productImages.length === 0}>Precificação</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="input" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid md:grid-cols-12 gap-8">
                            <div className="md:col-span-5">
                                <Card className="h-full border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-purple-400 transition-all group overflow-hidden">
                                    <CardContent className="p-0 h-full flex flex-col relative h-[500px]">
                                        {productImages.length > 0 ? (
                                            <div className="p-4 grid grid-cols-2 gap-2 overflow-y-auto max-h-[500px]">
                                                {productImages.map((img, i) => (
                                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden shadow-sm border group-hover/img:border-purple-200 transition-colors">
                                                        <img src={img} className="w-full h-full object-cover" alt={`Upload ${i}`} />
                                                    </div>
                                                ))}
                                                <div className="col-span-2 py-8 flex flex-col items-center justify-center border-t border-dashed mt-4">
                                                    <Label htmlFor="add-more-btn" className="cursor-pointer flex flex-col items-center gap-2 text-purple-600 hover:text-purple-800">
                                                        <span className="bg-purple-100 p-2 rounded-full"><Upload className="w-4 h-4 ml-0.5" /></span>
                                                        <span className="text-sm font-medium">Adicionar mais fotos</span>
                                                    </Label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-purple-100 group-hover:scale-110 transition-transform duration-500">
                                                    <Upload className="w-10 h-10 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-xl text-slate-800 mb-1">Fotos do Produto</h3>
                                                    <p className="text-sm text-slate-500 max-w-[200px] mx-auto">Arraste seus arquivos ou clique para selecionar. <span className="text-red-500 block mt-1 font-medium">*Min. 1 imagem</span></p>
                                                </div>
                                            </div>
                                        )}
                                        <Input
                                            id="add-more-btn"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="opacity-0 absolute inset-0 cursor-pointer h-full w-full z-10"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
                                                    handleImagesUploaded(urls);
                                                }
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="md:col-span-7 space-y-6">
                                <Card className="bg-white shadow-xl shadow-slate-100 border-none relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full opacity-50" />
                                    <CardHeader>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <Package className="w-5 h-5 text-purple-600" /> Detalhes do Produto
                                        </CardTitle>
                                        <CardDescription>Obrigatório preencher todos os campos chaves para a IA.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="font-semibold text-slate-700">Nome do Produto <span className="text-red-500">*</span></Label>
                                            <Input
                                                placeholder="Ex: Tênis Nike Air Max 90"
                                                value={formData.nome}
                                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                className="h-12 text-lg border-slate-200 focus:border-purple-500 bg-slate-50/50"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-1">
                                                    <Tag className="w-3 h-3" /> SKU <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    placeholder="CODE-123"
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-1">
                                                    <Weight className="w-3 h-3" /> Peso (g) <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    placeholder="1000"
                                                    value={formData.peso}
                                                    onChange={(e) => setFormData(p => ({ ...p, peso: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" /> Preço de Custo (R$) <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                className="font-mono"
                                                value={formData.precoCusto}
                                                onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                            />
                                            <p className="text-[10px] text-slate-400">Usado para cálculo de margem automática.</p>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <Label>Descrição Adicional (Opcional - Atlas enriquece)</Label>
                                            <Textarea
                                                placeholder="Características, material, benefícios..."
                                                className="min-h-[100px] resize-none bg-slate-50/50"
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Button
                                    size="lg"
                                    className="w-full h-16 text-xl font-bold rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl shadow-blue-200 transition-all hover:scale-[1.01]"
                                    onClick={handleStartMagic}
                                    disabled={isAutomationRunning}
                                >
                                    {isAutomationRunning ? (
                                        <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Processando Agentes...</>
                                    ) : (
                                        <><Wand2 className="w-6 h-6 mr-3" /> Iniciar Mágica</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="process" className="space-y-8">
                        <div className="grid md:grid-cols-3 gap-6">
                            <AgentCard
                                name="ATLAS"
                                role="Análise & Estratégia"
                                icon={Brain}
                                status={getStepStatus('Geração de Comando') as any}
                                color="purple"
                                progress={unifiedCommandsData ? "Estratégia Visual Definida" : undefined}
                            />
                            <AgentCard
                                name="LYRA"
                                role="Copywriting Persuasivo"
                                icon={FileText}
                                status={getStepStatus('Copywriting') as any}
                                color="pink"
                                progress={copywritingData ? "Títulos & Copys Gerados" : undefined}
                            />
                            <AgentCard
                                name="ORION"
                                role="Estúdio Visual & Design"
                                icon={ImageIcon}
                                status={getStepStatus('Geração de Imagens') as any}
                                color="blue"
                                progress={geminiImages.length > 0 ? `${geminiImages.length} imagens renderizadas` : undefined}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-12">
                            <Card className="h-[400px] overflow-hidden bg-slate-900 text-slate-100 border-none shadow-2xl">
                                <CardHeader className="bg-slate-800/50 pb-2">
                                    <CardTitle className="text-sm font-mono text-slate-400 flex items-center gap-2">
                                        <Cpu className="w-4 h-4" /> TERMINAL AGENTES
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="font-mono text-sm p-4 overflow-y-auto h-full space-y-4">
                                    {!isAutomationRunning && !unifiedCommandsData && <p className="text-slate-600 animate-pulse">_ Aguardando input...</p>}

                                    {unifiedCommandsData && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                            <p className="text-purple-400 font-bold">[ATLAS]: Análise concluída.</p>
                                            <p className="text-slate-300 ml-4 border-l-2 border-purple-800 pl-2">
                                                Conceito: {unifiedCommandsData.visual_concept || 'Extraído'}<br />
                                                Tags: {unifiedCommandsData.tags?.join(', ') || 'N/A'}
                                            </p>
                                        </div>
                                    )}

                                    {copywritingData && (
                                        <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-left-2">
                                            <p className="text-pink-400 font-bold">[LYRA]: Copywriting finalizado.</p>
                                            <p className="text-slate-300 ml-4 border-l-2 border-pink-800 pl-2">
                                                "{copywritingData.headlines?.[0] || '...'}"
                                            </p>
                                        </div>
                                    )}

                                    {geminiImages.length > 0 && (
                                        <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-left-2">
                                            <p className="text-blue-400 font-bold">[ORION]: Renderizando assets...</p>
                                            <p className="text-green-400 ml-4">✔ {geminiImages.length} frames gerados.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="h-[400px] bg-white shadow-2xl border-none flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Eye className="w-4 h-4" /> Live Preview</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 p-0 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                                    {productImages.sort(() => Math.random() - 0.5).slice(0, 1).map((img, i) => (
                                        <img key={i} src={img} className="max-w-full max-h-full object-contain shadow-lg rounded-md animate-in zoom-in duration-700" />
                                    ))}
                                    {productImages.length === 0 && <p className="text-slate-400">Nenhuma imagem gerada ainda.</p>}
                                </CardContent>
                                <div className="p-4 bg-white border-t flex justify-end">
                                    <Button variant="outline" onClick={() => setActiveTab('results')} disabled={productImages.length === 0}>
                                        Ver Galeria Completa <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="results">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600" /> Galeria de Ativos</h3>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => toast.success("Projeto salvo!")}><Lock className="w-4 h-4 mr-2" /> Salvar</Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => toast.success("Exportando...")}><Rocket className="w-4 h-4 mr-2" /> Exportar</Button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                            <ProductImagesGrid
                                images={productImages}
                                productName={formData.nome}
                                productId={productId}
                                onDelete={(index) => {
                                    setProductImages(prev => prev.filter((_, i) => i !== index));
                                }}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="pricing">
                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><DollarSign className="w-6 h-6 text-green-600" /> Centro de Lucratividade</h3>
                                    <p className="text-slate-500">Simule ganhos reais descontando taxas de marketplaces e impostos.</p>
                                </div>
                            </div>

                            <AdvancedPricingSimulator
                                productName={formData.nome || 'Produto sem nome'}
                                productSku={formData.sku || 'N/A'}
                                initialCost={Number(formData.precoCusto) || 0}
                                initialWeight={Number(formData.peso) || 0}
                                productImage={productImages[0]}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </>
    );
}
