
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Edit3, Hash, File, FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { useMagicStudioController } from "@/hooks/useMagicStudioController";

interface VariantProps {
    state: ReturnType<typeof useMagicStudioController>['state'];
    actions: ReturnType<typeof useMagicStudioController>['actions'];
}

export function Variant05Obsidian({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    return (
        <div className="min-h-screen bg-[#000000] font-sans text-[#dcddde] flex selection:bg-[#7f6df2] selection:text-white">

            {/* SIDEBAR - FILE TREE STYLE */}
            <aside className="w-64 bg-[#111111] border-r border-[#333333] flex-shrink-0 flex flex-col p-4">
                <div className="flex items-center gap-2 mb-6 text-[#7f6df2] px-2">
                    <Hash className="w-5 h-5" />
                    <span className="font-bold text-lg">Magic Vault</span>
                </div>

                <div className="space-y-1">
                    <div className="px-2 py-1 text-xs font-bold text-[#555555] uppercase">Workspace</div>
                    <button onClick={() => setActiveTab('input')} className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm ${activeTab === 'input' ? 'bg-[#222222] text-[#7f6df2]' : 'text-[#888888] hover:text-[#dcddde]'}`}>
                        <File className="w-4 h-4" /> 00_Input.md
                    </button>
                    <button onClick={() => isAutomationRunning && setActiveTab('process')} className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm ${activeTab === 'process' ? 'bg-[#222222] text-[#7f6df2]' : 'text-[#888888] hover:text-[#dcddde]'} disabled:opacity-30`} disabled={!isAutomationRunning}>
                        <Zap className="w-4 h-4" /> 01_Process_Log.md
                    </button>
                    <button onClick={() => productImages.length > 0 && setActiveTab('results')} className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm ${activeTab === 'results' ? 'bg-[#222222] text-[#7f6df2]' : 'text-[#888888] hover:text-[#dcddde]'} disabled:opacity-30`} disabled={productImages.length === 0}>
                        <ImageIcon className="w-4 h-4" /> 02_Gallery_View.md
                    </button>
                </div>

                <div className="mt-auto border-t border-[#333333] pt-4">
                    <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#dcddde] px-2 mb-2">
                        <Settings className="w-4 h-4" /> Settings.json
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT - EDITOR STYLE */}
            <main className="flex-1 p-8 md:p-12 relative overflow-y-auto">

                {/* HEADER PATH */}
                <div className="mb-8 font-mono text-sm text-[#555555] flex items-center gap-2">
                    root <ChevronRight className="w-4 h-4" /> magic-studio <ChevronRight className="w-4 h-4" /> {activeTab}-view
                </div>

                {activeTab === 'input' && (
                    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-500">

                        {/* TITLE */}
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-4"># New Campaign</h1>
                            <div className="h-px bg-[#333333] w-full" />
                        </div>

                        {/* UPLOAD SECTION - MARKDOWN QUOTE STYLE */}
                        <div className="border-l-4 border-[#7f6df2] pl-6 py-2 bg-[#111111] relative group">
                            <h3 className="text-lg font-bold text-[#7f6df2] mb-2 flex items-center gap-2"><FolderOpen className="w-5 h-5" /> Assets</h3>
                            {productImages.length > 0 ? (
                                <div className="grid grid-cols-4 gap-4">
                                    {productImages.map((img, i) => (
                                        <div key={i} className="aspect-square bg-[#000] border border-[#333] rounded overflow-hidden">
                                            <img src={img} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[#555] font-mono">{'>'}  No images linked. Drop files here to mount volume.</div>
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
                        </div>

                        {/* FORM SECTIONS */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">## Metadata</h2>

                            <div className="space-y-4">
                                <div className="grid gap-1">
                                    <Label className="text-xs text-[#555] uppercase font-bold">Product Name</Label>
                                    <Input
                                        value={formData.nome}
                                        onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                        className="bg-[#111] border-none rounded-none border-b border-[#333] focus:border-[#7f6df2] px-0 text-lg text-white placeholder:text-[#333]"
                                        placeholder="Enter_Product_Name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="grid gap-1">
                                        <Label className="text-xs text-[#555] uppercase font-bold">SKU</Label>
                                        <Input
                                            value={formData.sku}
                                            onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                            className="bg-[#111] border-none rounded-none border-b border-[#333] focus:border-[#7f6df2] px-0 font-mono text-[#7f6df2] placeholder:text-[#333]"
                                            placeholder="SKU-XXXX"
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs text-[#555] uppercase font-bold">Cost</Label>
                                        <Input
                                            type="number"
                                            value={formData.precoCusto}
                                            onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                            className="bg-[#111] border-none rounded-none border-b border-[#333] focus:border-[#7f6df2] px-0 font-mono text-[#7f6df2] placeholder:text-[#333]"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-1">
                                    <Label className="text-xs text-[#555] uppercase font-bold">Context / Description</Label>
                                    <Textarea
                                        value={formData.descricao}
                                        onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                        className="bg-[#111] border border-[#333] focus:border-[#7f6df2] rounded-md min-h-[150px] font-mono text-sm text-[#ccc] p-4"
                                        placeholder="> Enter additional context..."
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleStartMagic}
                                disabled={isAutomationRunning}
                                className="w-full bg-[#7f6df2] hover:bg-[#6c5dd3] text-white font-bold h-12 rounded-md mt-4"
                            >
                                {isAutomationRunning ? "[[ PROCESSING ]]" : "[[ RUN MAGIC ]]"}
                            </Button>
                        </div>

                    </div>
                )}

                {activeTab === 'process' && (
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-bold text-white mb-6">## System Logs</h1>
                        <div className="space-y-4 font-mono text-sm">
                            {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                const status = i === 0 ? getStepStatus('Geração de Comando')
                                    : i === 1 ? getStepStatus('Copywriting')
                                        : getStepStatus('Geração de Imagens');
                                return (
                                    <div key={i} className="flex items-center gap-4 py-2 border-b border-[#222]">
                                        <span className="text-[#555]">{`[${new Date().toLocaleTimeString()}]`}</span>
                                        <span className={`font-bold ${status === 'running' ? 'text-[#7f6df2]' : status === 'completed' ? 'text-green-500' : 'text-[#888]'}`}>{agent}</span>
                                        <span className="text-[#888]">Status: {status}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="max-w-5xl mx-auto">
                        <h1 className="text-2xl font-bold text-white mb-6">## Gallery</h1>
                        <ProductImagesGrid
                            images={productImages}
                            productName={formData.nome}
                            productId={productId}
                            onDelete={(index) => {
                                setProductImages(prev => prev.filter((_, i) => i !== index));
                            }}
                        />
                    </div>
                )}

                {/* Hidden Dialog for Settings */}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogContent className="bg-[#111] border-[#333] text-[#dcddde]">
                        <DialogHeader><DialogTitle>Settings.json</DialogTitle></DialogHeader>
                        <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                    </DialogContent>
                </Dialog>

            </main>

        </div>
    );
}
