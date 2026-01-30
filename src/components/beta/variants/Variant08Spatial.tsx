
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Box, Layers, Cuboid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { useMagicStudioController } from "@/hooks/useMagicStudioController";

interface VariantProps {
    state: ReturnType<typeof useMagicStudioController>['state'];
    actions: ReturnType<typeof useMagicStudioController>['actions'];
}

export function Variant08Spatial({ state, actions }: VariantProps) {
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
        <div className="min-h-screen bg-[#e0e5ec] font-sans text-slate-700 p-8 perspective-1000 overflow-hidden flex items-center justify-center">

            {/* 3D Container */}
            <div className="w-full max-w-7xl h-[85vh] relative transform-style-3d rotate-x-6 transition-transform duration-700 ease-out hover:rotate-x-2">

                {/* BACKGROUND PLANE */}
                <div className="absolute inset-0 bg-[#e0e5ec] rounded-[40px] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] transform translate-z-[-100px]" />

                {/* HEADER FLOATING */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#e0e5ec] px-8 py-3 rounded-2xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] flex items-center gap-4 transform translate-z-20">
                    <Cuboid className="w-6 h-6 text-purple-500" />
                    <span className="font-bold text-lg tracking-wider">SPATIAL STUDIO</span>
                </div>

                {/* MAIN CARD */}
                <div className="absolute inset-0 bg-[#e0e5ec] rounded-[30px] border border-white/50 p-8 flex gap-8 transform translate-z-0 shadow-inner">

                    {/* LEFT NAV PANEL - NEUMORPHIC */}
                    <div className="w-24 flex flex-col items-center gap-6 py-8 bg-[#e0e5ec] rounded-2xl shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
                        <button onClick={() => setActiveTab('input')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeTab === 'input' ? 'shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-purple-600' : 'shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] hover:scale-95'}`}>
                            <Package className="w-5 h-5" />
                        </button>
                        <button onClick={() => isAutomationRunning && setActiveTab('process')} disabled={!isAutomationRunning} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 ${activeTab === 'process' ? 'shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-purple-600' : 'shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] hover:scale-95'}`}>
                            <Zap className="w-5 h-5" />
                        </button>
                        <button onClick={() => productImages.length > 0 && setActiveTab('results')} disabled={productImages.length === 0} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 ${activeTab === 'results' ? 'shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-purple-600' : 'shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] hover:scale-95'}`}>
                            <ImageIcon className="w-5 h-5" />
                        </button>

                        <div className="mt-auto">
                            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] hover:text-purple-600">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* CONTENT AREA - FLOATING ABOVE */}
                    <div className="flex-1 bg-[#e0e5ec] rounded-2xl shadow-[10px_10px_20px_#bebebe,-10px_-10px_20px_#ffffff] p-8 overflow-y-auto transform translate-z-10 relative">

                        {activeTab === 'input' && (
                            <div className="grid md:grid-cols-2 gap-12 h-full">

                                {/* UPLOAD - DEEPLY PRESSED */}
                                <div className="relative group">
                                    <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest pl-2">Source Material</h3>
                                    <div className="h-[400px] rounded-2xl bg-[#e0e5ec] shadow-[inset_8px_8px_16px_#bebebe,inset_-8px_-8px_16px_#ffffff] p-6 flex items-center justify-center overflow-hidden hover:shadow-[inset_12px_12px_24px_#bebebe,inset_-12px_-12px_24px_#ffffff] transition-all">
                                        {productImages.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4 w-full h-full overflow-y-auto p-2">
                                                {productImages.map((img, i) => (
                                                    <div key={i} className="rounded-xl p-1 shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff]">
                                                        <img src={img} className="w-full h-full object-cover rounded-lg" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-400">
                                                <div className="w-16 h-16 rounded-full shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] flex items-center justify-center mb-4">
                                                    <Upload className="w-6 h-6 text-purple-500" />
                                                </div>
                                                <span className="font-bold">Drop Zone</span>
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
                                    </div>
                                </div>

                                {/* FORM - ELEMENTS POPPING OUT */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest pl-2">Parameters</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <Label className="ml-2 text-xs font-bold text-slate-500">Product Title</Label>
                                            <Input
                                                value={formData.nome}
                                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                className="mt-1 h-12 rounded-xl bg-[#e0e5ec] border-none shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] transition-all px-4"
                                                placeholder="Name..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <Label className="ml-2 text-xs font-bold text-slate-500">SKU</Label>
                                                <Input
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                    className="mt-1 h-12 rounded-xl bg-[#e0e5ec] border-none shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] px-4"
                                                    placeholder="..."
                                                />
                                            </div>
                                            <div>
                                                <Label className="ml-2 text-xs font-bold text-slate-500">Cost</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.precoCusto}
                                                    onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                    className="mt-1 h-12 rounded-xl bg-[#e0e5ec] border-none shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] px-4"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="ml-2 text-xs font-bold text-slate-500">Deep Dive Details</Label>
                                            <Textarea
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                className="mt-1 min-h-[140px] rounded-xl bg-[#e0e5ec] border-none shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-4 resize-none"
                                                placeholder="Description..."
                                            />
                                        </div>

                                        <Button
                                            onClick={handleStartMagic}
                                            disabled={isAutomationRunning}
                                            className="w-full h-14 rounded-xl bg-[#e0e5ec] text-purple-600 font-bold shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] hover:shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] transition-all transform active:scale-95 border border-white/20 text-lg"
                                        >
                                            {isAutomationRunning ? "Processing..." : "Initiate Sequence"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'process' && (
                            <div className="flex flex-col gap-6 justify-center items-center h-full">
                                {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                    const status = i === 0 ? getStepStatus('Geração de Comando')
                                        : i === 1 ? getStepStatus('Copywriting')
                                            : getStepStatus('Geração de Imagens');

                                    return (
                                        <div key={i} className={`
                                    w-full max-w-lg p-6 rounded-2xl flex items-center justify-between transition-all duration-500
                                    ${status === 'running' ? 'shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] text-purple-600' : 'shadow-[10px_10px_20px_#bebebe,-10px_-10px_20px_#ffffff]'}
                                `}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-full ${status === 'running' ? 'bg-purple-100' : 'bg-[#e0e5ec] shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff]'}`}>
                                                    <Brain className="w-6 h-6" />
                                                </div>
                                                <h3 className="font-bold text-lg">{agent}</h3>
                                            </div>
                                            <Badge variant="outline" className="border-none bg-transparent font-bold">{status}</Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className="h-full">
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

            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-[#e0e5ec] rounded-2xl shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] border-none">
                    <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                </DialogContent>
            </Dialog>

        </div>
    );
}
