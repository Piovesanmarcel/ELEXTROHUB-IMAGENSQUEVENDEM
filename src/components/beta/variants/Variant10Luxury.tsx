
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Diamond, Crown, Gem
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

export function Variant10Luxury({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    // Custom Gold Input
    const GoldInput = (props: any) => (
        <div className="relative group p-[1px] bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 rounded-lg">
            <Input {...props} className={`relative bg-[#0a0a0a] border-none text-[#e2c17a] placeholder:text-[#e2c17a]/30 focus:ring-0 rounded-md font-serif ${props.className}`} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] font-serif text-[#e2c17a] selection:bg-[#c6a855] selection:text-black">

            {/* Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]" />

            <header className="relative z-10 border-b border-[#e2c17a]/30 py-6">
                <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
                    <div className="flex flex-col items-center">
                        <Crown className="w-8 h-8 text-[#e2c17a] mb-1" />
                        <span className="text-2xl font-bold tracking-[0.2em] uppercase text-[#e2c17a]">Royale</span>
                        <span className="text-[10px] tracking-[0.4em] text-[#8e7b51] uppercase">Studio Edition</span>
                    </div>

                    <div className="flex gap-8 items-center text-sm tracking-widest uppercase text-[#8e7b51]">
                        <button className="hover:text-[#e2c17a] transition-colors">Atelier</button>
                        <button className="hover:text-[#e2c17a] transition-colors">Portfolio</button>
                        <button onClick={() => setShowSettings(true)} className="hover:text-[#e2c17a] transition-colors flex items-center gap-2"><Settings className="w-3 h-3" /> Config</button>
                        <Button onClick={handleNewProject} variant="outline" className="border-[#e2c17a] text-[#e2c17a] hover:bg-[#e2c17a] hover:text-black uppercase text-xs tracking-widest px-6 ml-4">New Commission</Button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-8 py-16">

                <div className="text-center mb-24">
                    <h1 className="text-6xl font-thin tracking-wider mb-6 text-white">The Art of Automation</h1>
                    <div className="w-24 h-[1px] bg-[#e2c17a] mx-auto" />
                </div>

                <div className="grid grid-cols-12 gap-16">

                    {/* LEFT NAV - VERTICAL ELEGANCE */}
                    <div className="col-span-12 md:col-span-3 border-r border-[#e2c17a]/20 pr-8">
                        <div className="flex flex-col gap-12 sticky top-12">
                            <button onClick={() => setActiveTab('input')} className={`text-left group transition-all ${activeTab === 'input' ? 'pl-8 border-l-2 border-[#e2c17a]' : 'opacity-50 hover:opacity-100 hover:pl-4 border-l-2 border-transparent'}`}>
                                <span className="text-xs tracking-widest text-[#8e7b51] block mb-2">PHASE I</span>
                                <span className="text-2xl text-white group-hover:text-[#e2c17a] transition-colors">Acquisition</span>
                            </button>
                            <button onClick={() => isAutomationRunning && setActiveTab('process')} disabled={!isAutomationRunning} className={`text-left group transition-all disabled:opacity-20 ${activeTab === 'process' ? 'pl-8 border-l-2 border-[#e2c17a]' : 'opacity-50 hover:opacity-100 hover:pl-4 border-l-2 border-transparent'}`}>
                                <span className="text-xs tracking-widest text-[#8e7b51] block mb-2">PHASE II</span>
                                <span className="text-2xl text-white group-hover:text-[#e2c17a] transition-colors">Refinement</span>
                            </button>
                            <button onClick={() => productImages.length > 0 && setActiveTab('results')} disabled={productImages.length === 0} className={`text-left group transition-all disabled:opacity-20 ${activeTab === 'results' ? 'pl-8 border-l-2 border-[#e2c17a]' : 'opacity-50 hover:opacity-100 hover:pl-4 border-l-2 border-transparent'}`}>
                                <span className="text-xs tracking-widest text-[#8e7b51] block mb-2">PHASE III</span>
                                <span className="text-2xl text-white group-hover:text-[#e2c17a] transition-colors">Exhibition</span>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="col-span-12 md:col-span-9 min-h-[600px]">

                        {activeTab === 'input' && (
                            <div className="space-y-16 animate-in slide-in-from-bottom-8 duration-700">

                                {/* UPLOAD SECTION */}
                                <div className="grid md:grid-cols-2 gap-12">
                                    <div className="relative aspect-[4/5] bg-[#0a0a0a] border border-[#e2c17a]/30 p-2 group">
                                        <div className="absolute top-0 left-0 w-full h-full border border-[#e2c17a]/50 scale-[0.98] pointer-events-none" />

                                        <div className="h-full w-full bg-[#111] flex flex-col items-center justify-center relative overflow-hidden">
                                            {productImages.length > 0 ? (
                                                <div className="grid grid-cols-2 w-full h-full">
                                                    {productImages.map((img, i) => (
                                                        <img key={i} src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                                    ))}
                                                </div>
                                            ) : (
                                                <>
                                                    <Diamond className="w-12 h-12 text-[#e2c17a] mb-6 font-thin" />
                                                    <span className="tracking-widest uppercase text-xs">Upload Masterpiece</span>
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

                                    <div className="flex flex-col justify-center space-y-8">
                                        <div>
                                            <Label className="block text-xs uppercase tracking-widest text-[#8e7b51] mb-2">Classification</Label>
                                            <GoldInput
                                                value={formData.nome}
                                                onChange={(e: any) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                className="h-14 text-2xl"
                                                placeholder="Product Name"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <Label className="block text-xs uppercase tracking-widest text-[#8e7b51] mb-2">Identifier</Label>
                                                <GoldInput
                                                    value={formData.sku}
                                                    onChange={(e: any) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                    className="h-12"
                                                    placeholder="SKU"
                                                />
                                            </div>
                                            <div>
                                                <Label className="block text-xs uppercase tracking-widest text-[#8e7b51] mb-2">Valuation</Label>
                                                <GoldInput
                                                    type="number"
                                                    value={formData.precoCusto}
                                                    onChange={(e: any) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                    className="h-12"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="block text-xs uppercase tracking-widest text-[#8e7b51] mb-2">Provenance</Label>
                                            <div className="relative group p-[1px] bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 rounded-lg">
                                                <Textarea
                                                    value={formData.descricao}
                                                    onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                    className="bg-[#0a0a0a] border-none text-[#e2c17a] placeholder:text-[#e2c17a]/30 focus:ring-0 rounded-md font-serif min-h-[150px] resize-none"
                                                    placeholder="Detail the artifact..."
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleStartMagic}
                                            disabled={isAutomationRunning}
                                            className="h-16 bg-[#e2c17a] text-black hover:bg-white uppercase tracking-[0.2em] font-bold text-sm transition-all duration-500 hover:tracking-[0.4em]"
                                        >
                                            {isAutomationRunning ? "Refining..." : "Commence Creation"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'process' && (
                            <div className="space-y-12">
                                <h2 className="text-3xl font-thin tracking-wider text-center mb-16 text-white border-b border-[#e2c17a]/20 pb-8">The Process</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                        const status = i === 0 ? getStepStatus('Geração de Comando')
                                            : i === 1 ? getStepStatus('Copywriting')
                                                : getStepStatus('Geração de Imagens');

                                        return (
                                            <div key={i} className="text-center group cursor-default">
                                                <div className={`w-24 h-24 mx-auto border border-[#e2c17a] rounded-full flex items-center justify-center mb-6 transition-all duration-700 ${status === 'running' ? 'scale-110 bg-[#e2c17a] text-black' : 'bg-transparent text-[#e2c17a]'}`}>
                                                    <Gem className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-xl text-white tracking-widest mb-2">{agent}</h3>
                                                <p className="text-xs uppercase tracking-[0.2em] text-[#8e7b51]">{status}</p>
                                                <div className={`w-[1px] h-12 bg-[#e2c17a] mx-auto mt-6 transition-all duration-500 ${status === 'running' ? 'h-24 opacity-100' : 'h-0 opacity-0'}`} />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className="bg-[#0a0a0a] border border-[#e2c17a]/30 p-12 relative">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#e2c17a]" />
                                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#e2c17a]" />
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#e2c17a]" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#e2c17a]" />

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

            </main>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-[#050505] border-[#e2c17a] text-[#e2c17a]">
                    <DialogHeader><DialogTitle className="font-serif tracking-widest uppercase text-center border-b border-[#e2c17a]/30 pb-4">Configuration</DialogTitle></DialogHeader>
                    <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                </DialogContent>
            </Dialog>
        </div>
    );
}
