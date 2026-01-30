
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Signal, Wifi, Battery, Home, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { useMagicStudioController } from "@/hooks/useMagicStudioController";

interface VariantProps {
    state: ReturnType<typeof useMagicStudioController>['state'];
    actions: ReturnType<typeof useMagicStudioController>['actions'];
}

export function Variant14Mobile({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    // Simulate Mobile Time
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden">

            {/* PHONE FRAME */}
            <div className="relative w-[375px] h-[812px] bg-black rounded-[40px] shadow-[0_0_0_12px_#1a1a1a,0_0_0_14px_#333,0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden border-[8px] border-black ring-1 ring-white/10">

                {/* Dynamic Island / Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[30px] w-[120px] bg-black rounded-b-2xl z-50"></div>

                {/* STATUS BAR */}
                <div className="absolute top-0 left-0 w-full px-6 pt-3 flex justify-between items-center text-white z-40 text-xs font-medium">
                    <span>{time}</span>
                    <div className="flex gap-1.5">
                        <Signal className="w-3.5 h-3.5" />
                        <Wifi className="w-3.5 h-3.5" />
                        <Battery className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* APP CONTENT */}
                <div className="bg-slate-50 w-full h-full pt-12 flex flex-col relative overflow-hidden">

                    {/* App Header */}
                    <div className="px-5 pb-4 flex justify-between items-center bg-white border-b border-slate-100">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Magic Studio</h1>
                        <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">

                        {activeTab === 'input' && (
                            <div className="p-5 space-y-6">

                                {/* Story-like Upload */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-slate-800">Your Stories</h3>
                                        <span className="text-xs text-blue-500 font-medium">Auto-scan</span>
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                        <div className="flex-shrink-0 w-20 h-28 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative flex-none">
                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md mb-1"><Upload className="w-4 h-4" /></div>
                                            <span className="text-[10px] text-slate-500 font-medium">Add</span>
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
                                        {productImages.map((img, i) => (
                                            <div key={i} className="flex-shrink-0 w-20 h-28 rounded-xl ring-2 ring-emerald-500 p-[2px] overflow-hidden flex-none">
                                                <img src={img} className="w-full h-full object-cover rounded-lg" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Cards Parameters */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800">Parameters</h3>

                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-400 font-medium uppercase">Product</label>
                                            <Input
                                                value={formData.nome}
                                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                className="border-none p-0 h-auto text-lg font-semibold placeholder:text-slate-300 focus-visible:ring-0"
                                                placeholder="Enter name"
                                            />
                                        </div>
                                        <div className="h-px bg-slate-100" />
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-400 font-medium uppercase">SKU</label>
                                                <Input
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                    className="border-none p-0 h-auto text-sm font-medium placeholder:text-slate-300 focus-visible:ring-0"
                                                    placeholder="Code"
                                                />
                                            </div>
                                            <div className="w-px bg-slate-100" />
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-400 font-medium uppercase">Cost</label>
                                                <Input
                                                    type="number"
                                                    value={formData.precoCusto}
                                                    onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                    className="border-none p-0 h-auto text-sm font-medium placeholder:text-slate-300 focus-visible:ring-0"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                        <label className="text-xs text-slate-400 font-medium uppercase mb-2 block">Context</label>
                                        <Textarea
                                            value={formData.descricao}
                                            onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                            className="border-none p-0 text-sm min-h-[100px] resize-none focus-visible:ring-0 placeholder:text-slate-300"
                                            placeholder="Add details..."
                                        />
                                    </div>

                                    <Button
                                        onClick={handleStartMagic}
                                        disabled={isAutomationRunning}
                                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 text-lg"
                                    >
                                        {isAutomationRunning ? "Processing..." : "Generate Assets"}
                                    </Button>
                                </div>

                            </div>
                        )}

                        {activeTab === 'process' && (
                            <div className="p-5">
                                <h2 className="text-2xl font-bold mb-6 text-slate-900">Live Status</h2>
                                <div className="space-y-4">
                                    {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                        const status = i === 0 ? getStepStatus('Geração de Comando')
                                            : i === 1 ? getStepStatus('Copywriting')
                                                : getStepStatus('Geração de Imagens');

                                        return (
                                            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'running' ? 'bg-blue-50 text-blue-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                                                    <Brain className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-800">{agent} Agent</h3>
                                                    <p className="text-xs text-slate-500 uppercase">{status}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className="p-0">
                                <div className="bg-white sticky top-0 px-5 py-3 shadow-sm z-10 flex justify-between items-center">
                                    <h2 className="font-bold">Gallery</h2>
                                    <Button size="sm" variant="ghost" className="text-blue-600">Select</Button>
                                </div>
                                <div className="p-1">
                                    <ProductImagesGrid
                                        images={productImages}
                                        productName={formData.nome}
                                        productId={productId}
                                        onDelete={(index) => {
                                            setProductImages(prev => prev.filter((_, i) => i !== index));
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                    </div>

                    {/* BOTTOM TAB BAR */}
                    <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-100 h-[84px] px-6 pb-6 flex justify-between items-center z-40">
                        <button onClick={() => setActiveTab('input')} className={`flex flex-col items-center gap-1 ${activeTab === 'input' ? 'text-blue-600' : 'text-slate-400'}`}>
                            <Home className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Home</span>
                        </button>

                        <button onClick={() => isAutomationRunning && setActiveTab('process')} disabled={!isAutomationRunning} className={`flex flex-col items-center gap-1 relative ${activeTab === 'process' ? 'text-blue-600' : 'text-slate-400 disabled:opacity-30'}`}>
                            <Zap className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Process</span>
                            {isAutomationRunning && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
                        </button>

                        <button onClick={() => productImages.length > 0 && setActiveTab('results')} disabled={productImages.length === 0} className={`flex flex-col items-center gap-1 ${activeTab === 'results' ? 'text-blue-600' : 'text-slate-400 disabled:opacity-30'}`}>
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Gallery</span>
                        </button>

                        <button onClick={handleNewProject} className="flex flex-col items-center gap-1 text-slate-400">
                            <User className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Profile</span>
                        </button>
                    </div>

                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-black rounded-full z-50"></div>

                </div>
            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="max-w-[340px] rounded-3xl"><N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" /></DialogContent>
            </Dialog>
        </div>
    );
}
