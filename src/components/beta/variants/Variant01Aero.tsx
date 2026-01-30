
import {
    Sparkles, Cpu, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, ChevronRight, Lock, Eye, RefreshCw,
    Package, DollarSign, Weight, Tag, Search, ArrowRight, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function Variant01Aero({ state, actions }: VariantProps) {
    const {
        productImages, referenceImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning, steps,
        unifiedCommandsData, copywritingData, geminiImages
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    // Glass Card Component
    const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
        <div className={`bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl ${className}`}>
            {children}
        </div>
    );

    return (
        <div className="min-h-screen bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-indigo-100 via-slate-100 to-purple-100 font-sans text-slate-800">

            {/* Background Orbs */}
            <div className="fixed top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="fixed top-20 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
            <div className="fixed -bottom-8 left-1/3 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

            {/* HEADER */}
            <header className="sticky top-0 z-50 py-4 px-6">
                <GlassCard className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between !bg-white/60">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-800">Magic Studio <span className="text-purple-500 font-light">Aero</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center bg-white/50 rounded-full px-4 py-1.5 border border-white/50 mr-4">
                            <Search className="w-4 h-4 text-slate-400 mr-2" />
                            <input className="bg-transparent border-none outline-none text-sm w-48 text-slate-600" placeholder="Buscar projetos..." />
                        </div>

                        <Dialog open={showSettings} onOpenChange={setShowSettings}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50">
                                    <Settings className="w-5 h-5 text-slate-600" />
                                </Button>
                            </DialogTrigger>
                            {/* Same Dialog Content */}
                            <DialogContent className="max-w-2xl backdrop-blur-3xl bg-white/80 border-white/50">
                                <DialogHeader>
                                    <DialogTitle>Configurações Aero</DialogTitle>
                                    <DialogDescription>Gerencie suas conexões.</DialogDescription>
                                </DialogHeader>
                                <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                            </DialogContent>
                        </Dialog>

                        <Button className="rounded-full bg-slate-900 hover:bg-slate-800 shadow-xl" onClick={handleNewProject}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Novo
                        </Button>
                    </div>
                </GlassCard>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">

                {/* HERO TITLE - Aero Style */}
                <div className="text-center mb-12 space-y-2">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 pb-2">
                        Crie Imagens Incríveis.
                    </h1>
                    <p className="text-slate-500 text-lg">A nova geração de design automotivo.</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="flex justify-center">
                        <GlassCard className="p-1.5 rounded-full inline-flex !shadow-lg">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="input" className="rounded-full px-8 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">Workspace</TabsTrigger>
                                <TabsTrigger value="process" className="rounded-full px-8 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all disabled:opacity-50" disabled={!isAutomationRunning && activeTab === 'input'}>Agents Hub</TabsTrigger>
                                <TabsTrigger value="results" className="rounded-full px-8 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white disabled:opacity-50" disabled={productImages.length === 0}>Galeria</TabsTrigger>
                                <TabsTrigger value="pricing" className="rounded-full px-8 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white disabled:opacity-50" disabled={productImages.length === 0}>Lucro</TabsTrigger>
                            </TabsList>
                        </GlassCard>
                    </div>

                    <TabsContent value="input" className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="grid md:grid-cols-12 gap-8">
                            {/* LEFT: UPLOAD - Floating Card */}
                            <div className="md:col-span-4">
                                <GlassCard className="h-[520px] p-6 !shadow-2xl !shadow-indigo-500/10 border-indigo-100 hover:border-indigo-300 transition-colors">
                                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-indigo-500" /> Upload
                                    </h3>
                                    <CardContent className="p-0 h-[420px] relative">
                                        {productImages.length > 0 ? (
                                            <div className="columns-2 gap-2 space-y-2 overflow-y-auto h-full pr-2">
                                                {productImages.map((img, i) => (
                                                    <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden shadow-md group relative">
                                                        <img src={img} className="w-full h-auto" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
                                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-500">
                                                    <Upload className="w-8 h-8" />
                                                </div>
                                                <p className="text-slate-600 font-medium">Arraste seus produtos</p>
                                                <p className="text-xs text-slate-400 mt-2">Suporta JPG, PNG, WEBP</p>
                                            </div>
                                        )}

                                        <Input
                                            type="file" multiple accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
                                                    handleImagesUploaded(urls);
                                                }
                                            }}
                                        />
                                    </CardContent>
                                </GlassCard>
                            </div>

                            {/* RIGHT: FORM - Clean Aero Inputs */}
                            <div className="md:col-span-8">
                                <GlassCard className="p-8 h-full !bg-white/80">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Package className="w-6 h-6 text-purple-600" />
                                            Detalhes do Produto
                                        </h2>
                                        <Badge variant="outline" className="rounded-full px-3 py-1 border-purple-200 text-purple-600 bg-purple-50">
                                            Meta-Dados
                                        </Badge>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider font-bold ml-1">Nome do Produto</Label>
                                            <Input
                                                value={formData.nome}
                                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all text-lg"
                                                placeholder="Ex: Smartwatch Ultra Titanium"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-slate-500 text-xs uppercase tracking-wider font-bold ml-1">SKU</Label>
                                                <Input
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                    className="h-12 rounded-xl border-slate-200 bg-slate-50"
                                                    placeholder="SW-001"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-500 text-xs uppercase tracking-wider font-bold ml-1">Preço Custo</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.precoCusto}
                                                    onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                    className="h-12 rounded-xl border-slate-200 bg-slate-50"
                                                    placeholder="R$ 0,00"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wider font-bold ml-1">Informações Extras</Label>
                                            <Textarea
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                className="rounded-2xl border-slate-200 bg-slate-50 min-h-[120px] resize-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all"
                                                placeholder="Descreva detalhes importantes que a IA não pode ver na imagem..."
                                            />
                                        </div>

                                        <Button
                                            onClick={handleStartMagic}
                                            disabled={isAutomationRunning}
                                            className="w-full h-16 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 shadow-xl shadow-slate-900/20 text-lg font-bold transition-all hover:scale-[1.01]"
                                        >
                                            {isAutomationRunning ? (
                                                <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Processando...</>
                                            ) : (
                                                <><Sparkles className="w-6 h-6 mr-3" /> Iniciar Geração Aero</>
                                            )}
                                        </Button>
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    </TabsContent>

                    {/* PROCESS TAB - Aero Visuals */}
                    <TabsContent value="process" className="space-y-8">
                        <div className="grid md:grid-cols-3 gap-6">
                            {['ATLAS', 'LYRA', 'ORION'].map((agentName, idx) => {
                                const status = idx === 0 ? getStepStatus('Geração de Comando')
                                    : idx === 1 ? getStepStatus('Copywriting')
                                        : getStepStatus('Geração de Imagens');

                                return (
                                    <GlassCard key={idx} className={`p-6 border-t-4 ${status === 'running' ? 'border-t-purple-500 animate-pulse' : 'border-t-transparent'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${status === 'running' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <Cpu className="w-6 h-6" />
                                            </div>
                                            <Badge variant={status === 'completed' ? 'default' : 'outline'}>{status}</Badge>
                                        </div>
                                        <h3 className="font-bold text-xl">{agentName}</h3>
                                        <p className="text-sm text-slate-500">Agente de Inteligência</p>
                                    </GlassCard>
                                )
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="results">
                        <GlassCard className="p-8">
                            <ProductImagesGrid
                                images={productImages}
                                productName={formData.nome}
                                productId={productId}
                                onDelete={(index) => {
                                    setProductImages(prev => prev.filter((_, i) => i !== index));
                                }}
                            />
                        </GlassCard>
                    </TabsContent>

                </Tabs>
            </main>
        </div>
    );
}
