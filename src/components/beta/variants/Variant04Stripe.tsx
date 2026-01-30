
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, ChevronRight, BarChart3, PieChart, Layers
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

export function Variant04Stripe({ state, actions }: VariantProps) {
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
        <div className="min-h-screen bg-[#f7f9fc] font-sans text-slate-800 flex flex-col md:flex-row">

            {/* SIDEBAR */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen fixed left-0 top-0 z-10">
                <div className="p-6 h-16 flex items-center border-b border-slate-100">
                    <div className="bg-[#635bff] text-white p-1 rounded-md mr-2">
                        <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[#0a2540] tracking-tight">Magic Studio</span>
                </div>

                <div className="p-4 space-y-1 overflow-y-auto flex-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-4">Overview</div>
                    <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#635bff] bg-[#635bff]/10 rounded-md">
                        <Layers className="w-4 h-4" /> Generator
                    </a>
                    <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
                        <BarChart3 className="w-4 h-4" /> Analytics
                    </a>
                    <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
                        <Image className="w-4 h-4" /> Assets Library
                    </a>
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button onClick={() => setShowSettings(true)} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                    <div className="mt-4 px-3 flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-slate-300 mr-2" />
                        <div className="text-xs font-medium text-slate-600">Enterprise Team</div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 p-6 md:p-12 max-w-7xl mx-auto w-full">

                {/* HEADER MOBILE */}
                <div className="md:hidden flex items-center justify-between mb-8">
                    <span className="font-bold text-[#0a2540]">Magic Studio</span>
                    <Button size="icon" variant="ghost"><Settings className="w-5 h-5" /></Button>
                </div>

                {/* TOP BAR */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#0a2540] mb-1">New Ad Campaign</h1>
                        <p className="text-slate-500 text-sm">Design, generate and publish your creative assets.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleNewProject} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 font-medium shadow-sm h-9 text-sm">
                            <RefreshCw className="w-3 h-3 mr-2" /> Reset
                        </Button>
                        <Button className="bg-[#635bff] hover:bg-[#5851d8] text-white font-medium shadow-sm h-9 text-sm shadow-[#635bff]/20">
                            Publish <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>

                {/* TABS AS CARDS */}
                <div className="bg-white rounded-xl shadow-[0_2px_5px_-1px_rgba(0,0,0,0.1),0_1px_3px_-1px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">

                    {/* STRIPE-LIKE TAB BAR */}
                    <div className="border-b border-slate-100 px-6 py-1 bg-white flex gap-6 overflow-x-auto">
                        {['input', 'process', 'results', 'pricing'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'input' || (isAutomationRunning && tab === 'process') || (productImages.length > 0)) {
                                        setActiveTab(tab);
                                    }
                                }}
                                className={`
                            py-4 px-1 text-sm font-medium border-b-2 transition-all capitalize
                            ${activeTab === tab
                                        ? 'border-[#635bff] text-[#635bff]'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                                disabled={tab !== 'input' && !(isAutomationRunning && tab === 'process') && !(productImages.length > 0)}
                            >
                                {tab === 'process' ? 'Intelligence' : tab === 'results' ? 'Gallery' : tab}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 bg-white min-h-[600px]">

                        {/* INPUT TAB */}
                        {activeTab === 'input' && (
                            <div className="grid md:grid-cols-12 gap-12 animate-in fade-in duration-300">
                                <div className="md:col-span-4">
                                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/50 transition-colors p-8 text-center h-[400px] flex flex-col items-center justify-center relative cursor-pointer group">
                                        {productImages.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2 w-full h-full overflow-y-auto pr-1">
                                                {productImages.map((img, i) => (
                                                    <img key={i} src={img} className="w-full h-24 object-cover rounded shadow-sm border border-slate-200" />
                                                ))}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-[#635bff] border border-slate-100">
                                                    <Upload className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-[#0a2540]">Upload product images</h3>
                                                <p className="text-xs text-slate-500 mt-2 max-w-[180px]">Drag and drop your files here or click to browse.</p>
                                            </>
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
                                </div>

                                <div className="md:col-span-8 space-y-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0a2540] mb-4">Product Details</h3>
                                        <div className="grid gap-6">
                                            <div className="grid grid-cols-1 gap-1">
                                                <Label className="text-xs font-semibold text-slate-700">Name</Label>
                                                <Input
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                    className="border-slate-200 focus:border-[#635bff] focus:ring-[#635bff]/20 h-10 shadow-sm transition-all"
                                                    placeholder="e.g. ergonomic chair"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="grid gap-1">
                                                    <Label className="text-xs font-semibold text-slate-700">SKU</Label>
                                                    <Input
                                                        value={formData.sku}
                                                        onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                        className="border-slate-200 focus:border-[#635bff] focus:ring-[#635bff]/20 h-10 shadow-sm font-mono text-sm"
                                                        placeholder="SKU-100"
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <Label className="text-xs font-semibold text-slate-700">Cost Price</Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.precoCusto}
                                                        onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                        className="border-slate-200 focus:border-[#635bff] focus:ring-[#635bff]/20 h-10 shadow-sm"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-xs font-semibold text-slate-700">Description</Label>
                                                <Textarea
                                                    value={formData.descricao}
                                                    onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                    className="min-h-[120px] border-slate-200 focus:border-[#635bff] focus:ring-[#635bff]/20 shadow-sm resize-none"
                                                    placeholder="Key features, materials, value proposition..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <Button
                                            onClick={handleStartMagic}
                                            disabled={isAutomationRunning}
                                            className="bg-[#635bff] hover:bg-[#5851d8] text-white font-medium shadow-lg shadow-[#635bff]/30 h-11 px-8 rounded-lg w-full md:w-auto transition-all transform hover:-translate-y-0.5"
                                        >
                                            {isAutomationRunning ? "Processing Request..." : "Start Generation"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PROCESS TAB */}
                        {activeTab === 'process' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid md:grid-cols-3 gap-6">
                                    {['ATLAS', 'LYRA', 'ORION'].map((agentName, idx) => {
                                        const status = idx === 0 ? getStepStatus('Geração de Comando')
                                            : idx === 1 ? getStepStatus('Copywriting')
                                                : getStepStatus('Geração de Imagens');

                                        return (
                                            <div key={idx} className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
                                                {status === 'running' && <div className="absolute top-0 left-0 w-full h-1 bg-[#635bff] animate-progress-indeterminate" />}
                                                <div className="flex justify-between items-start">
                                                    <div className="bg-[#f0f2f9] text-[#0a2540] p-2 rounded-md font-bold text-xs">{agentName}</div>
                                                    <Badge variant={status === 'completed' ? 'default' : 'secondary'} className={status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                                        {status}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[#0a2540]">Agent Phase {idx + 1}</h4>
                                                    <p className="text-xs text-slate-500">Processing logic nodes...</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* RESULTS TAB */}
                        {activeTab === 'results' && (
                            <div className="animate-in fade-in duration-300">
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

                    </div>
                </div>

                {/* Diag Settings (Hidden but required for hook) */}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
                        <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                    </DialogContent>
                </Dialog>

            </main>
        </div>
    );
}
