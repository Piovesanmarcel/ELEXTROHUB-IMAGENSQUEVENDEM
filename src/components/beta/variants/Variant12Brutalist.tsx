
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, X, AlertTriangle, Eye
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

export function Variant12Brutalist({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    // Brutalist Button Component
    const BButton = ({ children, onClick, disabled, className, variant = 'primary' }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
            border-4 border-black font-black uppercase text-lg px-8 py-4 shadow-[8px_8px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000] transition-all active:translate-x-2 active:translate-y-2 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed
            ${variant === 'primary' ? 'bg-[#ff6b6b] text-black hover:bg-[#ff8787]' : ''}
            ${variant === 'secondary' ? 'bg-[#4ecdc4] text-black hover:bg-[#7edbd5]' : ''}
            ${variant === 'outline' ? 'bg-white text-black hover:bg-gray-100' : ''}
            ${className}
        `}
        >
            {children}
        </button>
    );

    const BInput = (props: any) => (
        <input
            {...props}
            className={`w-full border-4 border-black p-4 font-bold text-xl shadow-[4px_4px_0px_#000] focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:text-black/30 ${props.className}`}
        />
    );

    return (
        <div className="min-h-screen bg-[#fff4e6] font-sans text-black p-8 selection:bg-black selection:text-white">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 border-b-8 border-black pb-8 gap-4">
                <div className="bg-yellow-400 border-4 border-black p-4 shadow-[8px_8px_0px_#000] rotate-2">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Magic<br />Studio</h1>
                </div>

                <div className="flex gap-4 flex-wrap">
                    <button onClick={() => setShowSettings(true)} className="bg-white border-4 border-black p-3 hover:bg-gray-200 transition-colors shadow-[4px_4px_0px_#000] font-bold uppercase flex items-center gap-2">
                        <Settings className="w-6 h-6" /> Config
                    </button>
                    <button onClick={handleNewProject} className="bg-black text-white border-4 border-black p-3 hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_#888] font-bold uppercase flex items-center gap-2">
                        <RefreshCw className="w-6 h-6" /> Reset
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">

                <div className="grid grid-cols-12 gap-8">

                    {/* NAVIGATION - VERTICAL TABS */}
                    <div className="col-span-12 md:col-span-3 flex flex-col gap-6">
                        {['input', 'process', 'results'].map((tab, idx) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'input' || isAutomationRunning || productImages.length > 0) setActiveTab(tab)
                                }}
                                disabled={tab !== 'input' && !isAutomationRunning && productImages.length === 0}
                                className={`
                            border-4 border-black p-6 text-2xl font-black uppercase text-left transition-all
                            ${activeTab === tab ? 'bg-[#a78bfa] text-white shadow-[8px_8px_0px_#000] -translate-y-2' : 'bg-white hover:bg-gray-100'}
                            disabled:opacity-30 disabled:cursor-not-allowed
                        `}
                            >
                                0{idx + 1}. {tab}
                            </button>
                        ))}

                        {/* Decorative Elements */}
                        <div className="bg-black text-white p-4 font-bold uppercase text-center rotate-1 mt-8">
                            Warning: Highly Experimental
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    <div className="col-span-12 md:col-span-9">
                        <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_#000] relative min-h-[600px]">

                            {/* Decorative X */}
                            <div className="absolute top-4 right-4 text-black"><X className="w-8 h-8 font-bold" /></div>

                            {activeTab === 'input' && (
                                <div className="space-y-12">
                                    <div className="grid md:grid-cols-2 gap-12">
                                        {/* UPLOAD BOX */}
                                        <div>
                                            <h2 className="text-3xl font-black uppercase mb-6 bg-yellow-300 inline-block px-2">Drop it here</h2>
                                            <div className="border-4 border-black border-dashed bg-gray-50 h-[400px] flex flex-col items-center justify-center relative hover:bg-yellow-50 transition-colors cursor-pointer group">
                                                {productImages.length > 0 ? (
                                                    <div className="grid grid-cols-2 gap-4 w-full h-full p-4 overflow-y-auto">
                                                        {productImages.map((img, i) => (
                                                            <div key={i} className="border-4 border-black shadow-[4px_4px_0px_#000]">
                                                                <img src={img} className="w-full h-24 object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-20 h-20 bg-black text-white flex items-center justify-center rounded-full mb-4">
                                                            <Upload className="w-10 h-10" />
                                                        </div>
                                                        <span className="font-bold text-xl uppercase">Upload Files</span>
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

                                        {/* FORM */}
                                        <div className="space-y-6">
                                            <h2 className="text-3xl font-black uppercase mb-6 bg-cyan-300 inline-block px-2">The Specs</h2>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="font-black uppercase text-sm block mb-1">Product Name</label>
                                                    <BInput
                                                        value={formData.nome}
                                                        onChange={(e: any) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                        placeholder="NAME"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="font-black uppercase text-sm block mb-1">SKU</label>
                                                        <BInput
                                                            value={formData.sku}
                                                            onChange={(e: any) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                            placeholder="XYZ-00"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="font-black uppercase text-sm block mb-1">Cost $$$</label>
                                                        <BInput
                                                            type="number"
                                                            value={formData.precoCusto}
                                                            onChange={(e: any) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="font-black uppercase text-sm block mb-1">Details</label>
                                                    <textarea
                                                        value={formData.descricao}
                                                        onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                        className="w-full border-4 border-black p-4 font-bold text-lg shadow-[4px_4px_0px_#000] focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all min-h-[140px] resize-none placeholder:text-black/30"
                                                        placeholder="TELL ME MORE..."
                                                    />
                                                </div>
                                            </div>

                                            <BButton
                                                onClick={handleStartMagic}
                                                disabled={isAutomationRunning}
                                                className="w-full text-2xl"
                                            >
                                                {isAutomationRunning ? "WORKING..." : "DO IT NOW ->"}
                                            </BButton>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'process' && (
                                <div className="space-y-8">
                                    <h2 className="text-4xl font-black uppercase text-center bg-black text-white py-4 -mx-8 -mt-8 mb-12 transform -rotate-1">Execution Log</h2>

                                    <div className="grid gap-6 max-w-2xl mx-auto">
                                        {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                            const status = i === 0 ? getStepStatus('Geração de Comando')
                                                : i === 1 ? getStepStatus('Copywriting')
                                                    : getStepStatus('Geração de Imagens');

                                            return (
                                                <div key={i} className={`
                                              border-4 border-black p-6 flex justify-between items-center transition-all
                                              ${status === 'running' ? 'bg-[#facc15] shadow-[8px_8px_0px_#000] translate-x-[-4px] translate-y-[-4px]' : 'bg-white shadow-[4px_4px_0px_#ccc] grayscale'}
                                          `}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-black text-white font-black w-12 h-12 flex items-center justify-center text-xl rounded-none">{i + 1}</div>
                                                        <h3 className="font-black text-2xl uppercase tracking-tighter">{agent}</h3>
                                                    </div>
                                                    <div className="font-mono font-bold uppercase border-2 border-black px-2 bg-white">{status}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'results' && (
                                <div>
                                    <div className="bg-black text-white p-4 font-black uppercase text-3xl mb-8 flex items-center gap-4">
                                        <Eye className="w-8 h-8" />
                                        <span>Visual Output</span>
                                    </div>
                                    <div className="bg-[#4ecdc4] p-4 border-4 border-black shadow-[8px_8px_0px_#000]">
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
                    </div>
                </div>
            </main>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="border-4 border-black shadow-[16px_16px_0px_#000] rounded-none bg-white p-0 overflow-hidden max-w-2xl">
                    <div className="bg-[#ff6b6b] p-4 border-b-4 border-black">
                        <DialogTitle className="font-black uppercase text-2xl">System Config</DialogTitle>
                    </div>
                    <div className="p-8">
                        <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
