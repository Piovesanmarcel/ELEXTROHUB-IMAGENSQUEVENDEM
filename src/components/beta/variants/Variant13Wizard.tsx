
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, ChevronDown, ChevronUp, CornerDownLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { useMagicStudioController } from "@/hooks/useMagicStudioController";
import { useState } from "react";

interface VariantProps {
    state: ReturnType<typeof useMagicStudioController>['state'];
    actions: ReturnType<typeof useMagicStudioController>['actions'];
}

export function Variant13Wizard({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    const [step, setStep] = useState(0);

    // Wizard Steps Logic
    const canAdvance = () => {
        if (step === 0) return productImages.length > 0;
        if (step === 1) return formData.nome.length > 0;
        if (step === 2) return formData.sku.length > 0;
        if (step === 3) return formData.precoCusto.length > 0;
        return true;
    }

    const nextStep = () => {
        if (canAdvance() && step < 5) setStep(s => s + 1);
    }

    const prevStep = () => {
        if (step > 0) setStep(s => s - 1);
    }

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-slate-800 flex flex-col transition-colors duration-500">

            {/* HEADER */}
            <header className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-[#fafafa]/80 backdrop-blur-sm">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-lg font-bold text-xl">M</div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-400">
                        {step < 5 ? `${Math.round(((step) / 5) * 100)}% completed` : 'Processing'}
                    </span>
                    <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-black transition-all duration-500 ease-out"
                            style={{ width: `${((step) / 5) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleNewProject} className="text-sm hover:underline">Restart</button>
                    <button onClick={() => setShowSettings(true)} className="text-sm hover:underline ml-4">Settings</button>
                </div>
            </header>

            {/* MAIN WIZARD AREA */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full relative min-h-screen">

                {/* QUESTION 1: UPLOAD */}
                <div className={`transition-all duration-700 absolute w-full ${step === 0 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
                    <span className="text-blue-500 font-bold mb-4 block text-lg">1 → The Basics</span>
                    <h1 className="text-4xl md:text-5xl font-light mb-8 text-[#191919]">First, show us what you're selling. <br /><span className="text-slate-400">Upload your product photos.</span></h1>

                    <div className="border border-slate-300 rounded-lg p-8 hover:border-black transition-colors bg-white cursor-pointer relative group text-center min-h-[200px] flex flex-col items-center justify-center">
                        {productImages.length > 0 ? (
                            <div className="grid grid-cols-4 gap-4 w-full">
                                {productImages.map((img, i) => (
                                    <img key={i} src={img} className="w-full h-24 object-cover rounded shadow-sm" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                                <span className="text-xl">Choose files or drag here</span>
                            </div>
                        )}
                        <Input
                            type="file" multiple accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files) {
                                    const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
                                    handleImagesUploaded(urls);
                                    // Auto advance slightly delayed for UX
                                    setTimeout(() => nextStep(), 1500);
                                }
                            }}
                        />
                    </div>
                    {productImages.length > 0 && (
                        <Button onClick={nextStep} className="mt-8 bg-black text-white hover:bg-slate-800 text-xl px-8 py-6 rounded-md">
                            OK <CheckCircle2 className="ml-2 w-5 h-5" />
                        </Button>
                    )}
                </div>

                {/* QUESTION 2: NAME */}
                <div className={`transition-all duration-700 absolute w-full ${step === 1 ? 'opacity-100 translate-y-0 pointer-events-auto' : step < 1 ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
                    <span className="text-blue-500 font-bold mb-4 block text-lg">2 → Identity</span>
                    <h1 className="text-4xl md:text-5xl font-light mb-8 text-[#191919]">What is this product called?</h1>
                    <input
                        value={formData.nome}
                        onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                        className="w-full text-4xl border-b border-black/20 focus:border-black pb-2 bg-transparent outline-none placeholder:text-slate-300 transition-colors"
                        placeholder="Type your answer here..."
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    />
                    <div className="mt-8 flex gap-4">
                        <Button onClick={nextStep} disabled={formData.nome.length === 0} className="bg-black text-white hover:bg-slate-800 text-xl px-8 py-6 rounded-md">
                            OK <CheckCircle2 className="ml-2 w-5 h-5" />
                        </Button>
                        <span className="text-sm text-slate-400 self-center">press Enter ↵</span>
                    </div>
                </div>

                {/* QUESTION 3: SKU */}
                <div className={`transition-all duration-700 absolute w-full ${step === 2 ? 'opacity-100 translate-y-0 pointer-events-auto' : step < 2 ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
                    <span className="text-blue-500 font-bold mb-4 block text-lg">3 → Inventory</span>
                    <h1 className="text-4xl md:text-5xl font-light mb-8 text-[#191919]">Great. Do you have an SKU for it?</h1>
                    <input
                        value={formData.sku}
                        onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                        className="w-full text-4xl border-b border-black/20 focus:border-black pb-2 bg-transparent outline-none placeholder:text-slate-300 transition-colors font-mono"
                        placeholder="SKU-123"
                        onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    />
                    <div className="mt-8 flex gap-4">
                        <Button onClick={nextStep} disabled={formData.sku.length === 0} className="bg-black text-white hover:bg-slate-800 text-xl px-8 py-6 rounded-md">
                            OK <CheckCircle2 className="ml-2 w-5 h-5" />
                        </Button>
                        <span className="text-sm text-slate-400 self-center">press Enter ↵</span>
                    </div>
                </div>

                {/* QUESTION 4: COST */}
                <div className={`transition-all duration-700 absolute w-full ${step === 3 ? 'opacity-100 translate-y-0 pointer-events-auto' : step < 3 ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
                    <span className="text-blue-500 font-bold mb-4 block text-lg">4 → Valuation</span>
                    <h1 className="text-4xl md:text-5xl font-light mb-8 text-[#191919]">And what is the cost price?</h1>
                    <input
                        type="number"
                        value={formData.precoCusto}
                        onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                        className="w-full text-4xl border-b border-black/20 focus:border-black pb-2 bg-transparent outline-none placeholder:text-slate-300 transition-colors"
                        placeholder="0.00"
                        onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    />
                    <div className="mt-8 flex gap-4">
                        <Button onClick={nextStep} disabled={formData.precoCusto.length === 0} className="bg-black text-white hover:bg-slate-800 text-xl px-8 py-6 rounded-md">
                            OK <CheckCircle2 className="ml-2 w-5 h-5" />
                        </Button>
                        <span className="text-sm text-slate-400 self-center">press Enter ↵</span>
                    </div>
                </div>

                {/* QUESTION 5: DESC & START */}
                <div className={`transition-all duration-700 absolute w-full ${step === 4 ? 'opacity-100 translate-y-0 pointer-events-auto' : step < 4 ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
                    <span className="text-blue-500 font-bold mb-4 block text-lg">5 → Final Touches</span>
                    <h1 className="text-4xl md:text-5xl font-light mb-8 text-[#191919]">Anything else we should know? <br /><span className="text-slate-400">Add some context.</span></h1>
                    <Textarea
                        value={formData.descricao}
                        onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                        className="w-full text-2xl border-none border-b border-black/20 focus:border-black bg-transparent outline-none placeholder:text-slate-300 transition-colors resize-none min-h-[150px] shadow-none p-0 focus-visible:ring-0"
                        placeholder="Main features, target audience, etc..."
                    />
                    <div className="mt-8 flex gap-4">
                        <Button
                            onClick={() => {
                                handleStartMagic();
                                setStep(5);
                            }}
                            className="bg-black text-white hover:bg-slate-800 text-xl px-8 py-6 rounded-md"
                        >
                            Submit & Generate <Sparkles className="ml-2 w-5 h-5" />
                        </Button>
                        <span className="text-sm text-slate-400 self-center">Ctrl + Enter</span>
                    </div>
                </div>

                {/* STEP 6: PROCESSING & RESULTS */}
                <div className={`transition-all duration-700 absolute w-full ${step === 5 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none text-center'}`}>

                    {!isAutomationRunning && productImages.length > 0 && activeTab !== "results" && (
                        <div className="text-center">
                            <h1 className="text-4xl font-light mb-4">You're all set!</h1>
                            <Button onClick={() => setActiveTab('results')} variant="outline">View Gallery</Button>
                        </div>
                    )}

                    {isAutomationRunning && (
                        <div className="max-w-xl mx-auto text-center space-y-8">
                            <h1 className="text-3xl font-light">Making magic happen...</h1>

                            <div className="space-y-4">
                                {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                    const status = i === 0 ? getStepStatus('Geração de Comando')
                                        : i === 1 ? getStepStatus('Copywriting')
                                            : getStepStatus('Geração de Imagens');
                                    return (
                                        <div key={i} className="flex items-center gap-4 text-left p-4 rounded bg-white shadow-sm border border-slate-100">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'running' ? 'bg-blue-100 text-blue-600' : status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {status === 'running' ? <Loader2 className="animate-spin w-4 h-4" /> : status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold">{agent}</h3>
                                                <p className="text-xs text-slate-500 uppercase">{status}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-100">
                            <h2 className="text-2xl font-light mb-6 text-center">Your Generated Assets</h2>
                            <ProductImagesGrid
                                images={productImages}
                                productName={formData.nome}
                                productId={productId}
                                onDelete={(index) => {
                                    setProductImages(prev => prev.filter((_, i) => i !== index));
                                }}
                            />
                            <Button onClick={handleNewProject} variant="outline" className="mt-8 mx-auto block">Start Fresh</Button>
                        </div>
                    )}

                </div>

            </main>

            {/* FOOTER NAV */}
            {step < 5 && (
                <div className="fixed bottom-0 right-0 p-6 flex gap-2">
                    <Button onClick={prevStep} disabled={step === 0} size="icon" variant="secondary" className="rounded-md">
                        <ChevronUp className="w-6 h-6" />
                    </Button>
                    <Button onClick={nextStep} disabled={!canAdvance()} size="icon" variant="secondary" className="rounded-md bg-black text-white hover:bg-slate-800">
                        <ChevronDown className="w-6 h-6" />
                    </Button>
                </div>
            )}

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent><N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" /></DialogContent>
            </Dialog>
        </div>
    );
}
