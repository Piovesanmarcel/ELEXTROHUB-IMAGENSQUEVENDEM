
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw, Pencil, Eraser, Pen, Highlighter, StickyNote
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

export function Variant20Sketch({ state, actions }: VariantProps) {
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
        <div className="min-h-screen bg-[#f3f0e8] font-serif text-slate-800 p-8 flex items-center justify-center selection:bg-yellow-200" style={{ backgroundImage: 'radial-gradient(#d3cfc3 1px, transparent 0)', backgroundSize: '20px 20px' }}>

            {/* NOTEBOOK PAGE */}
            <div className="w-full max-w-5xl bg-white min-h-[80vh] shadow-[10px_10px_30px_rgba(0,0,0,0.1)] relative p-8 md:p-16 rotate-1 transform border border-gray-200">

                {/* TAPE EFFECT */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#e8e4d0] opacity-80 rotate-2 shadow-sm" style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)' }} />

                {/* DOODLES */}
                <div className="absolute top-10 right-10 w-20 h-20 border-4 border-slate-800 rounded-full opacity-20 rotate-12" style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }} />
                <div className="absolute bottom-20 left-10 w-32 h-2 border-b-4 border-slate-800 opacity-20 -rotate-3" />

                {/* MAIN CONTENT */}
                <div className="relative">

                    {/* HEADER */}
                    <div className="flex flex-col items-center mb-12">
                        <h1 className="text-5xl font-bold tracking-tighter mb-2 font-display " style={{ fontFamily: 'Comic Sans MS, cursive' }}>Magic Sketchbook</h1>
                        <p className="text-xl text-slate-500 italic decoration-wavy underline">Ad Generator Idea Drafts</p>
                    </div>

                    {/* NAVIGATION TABS */}
                    <div className="flex justify-center gap-8 mb-12 border-b-2 border-slate-800 pb-2" style={{ borderStyle: 'solid', borderWidth: '0 0 3px 0', borderRadius: '0 0 200px 50px/ 0 0 5px 2px' }}>
                        {['Input', 'Process', 'Results'].map((tab, i) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'Input' || isAutomationRunning || productImages.length > 0) setActiveTab(tab.toLowerCase() as any)
                                }}
                                className={`text-2xl font-bold px-4 py-2 transform transition-transform hover:-rotate-2 hover:scale-110 ${activeTab === tab.toLowerCase() ? 'text-blue-600 underline decoration-4 decoration-yellow-300' : 'text-slate-400 line-through decoration-slate-300 hover:no-underline hover:text-slate-600'}`}
                                style={{ fontFamily: 'Comic Sans MS, cursive' }}
                            >
                                {i + 1}. {tab}
                            </button>
                        ))}
                    </div>

                    {/* SKETCH CONTENT */}
                    <div className="min-h-[400px]">

                        {activeTab === 'input' && (
                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="relative">
                                        <h3 className="font-bold text-xl mb-2 -rotate-2 bg-yellow-200 inline-block px-2">Project Details</h3>
                                        <div className="border-2 border-slate-800 p-4 space-y-4 rounded-xl" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                                            <Input
                                                value={formData.nome}
                                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                className="border-none border-b-2 border-slate-300 rounded-none px-0 shadow-none font-serif text-xl placeholder:italic focus-visible:ring-0 bg-transparent"
                                                placeholder="What are we making?"
                                            />
                                            <div className="flex gap-4">
                                                <Input
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                    className="border-none border-b-2 border-slate-300 rounded-none px-0 shadow-none font-serif placeholder:italic focus-visible:ring-0 bg-transparent"
                                                    placeholder="#SKU"
                                                />
                                                <Input
                                                    value={formData.precoCusto}
                                                    onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                    className="border-none border-b-2 border-slate-300 rounded-none px-0 shadow-none font-serif placeholder:italic focus-visible:ring-0 bg-transparent"
                                                    placeholder="$ Cost"
                                                />
                                            </div>
                                            <Textarea
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                className="border-none bg-[linear-gradient(transparent_24px,#ccc_25px)] bg-[size:100%_25px] leading-[25px] shadow-none resize-none min-h-[150px] font-serif text-lg focus-visible:ring-0"
                                                placeholder="Jot down some ideas..."
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleStartMagic} disabled={isAutomationRunning} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transform hover:scale-105 transition-transform" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                                        {isAutomationRunning ? "Sketching..." : "Start Drawing"} <Pencil className="ml-2 w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="relative">
                                    <h3 className="font-bold text-xl mb-2 rotate-1 bg-pink-200 inline-block px-2">Visuals</h3>
                                    <div className="w-full bg-white border-2 border-dashed border-slate-400 h-[300px] flex items-center justify-center p-6 cursor-pointer relative hover:bg-slate-50 transition-colors" style={{ borderRadius: '10px 40px 10px 40px / 40px 10px 40px 10px' }}>
                                        {productImages.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4 w-full h-full p-2 rotate-1">
                                                {productImages.map((img, i) => (
                                                    <div key={i} className="bg-white p-2 shadow-md rotate-1 border border-slate-100">
                                                        <img src={img} className="w-full h-24 object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center opacity-50">
                                                <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                                                <p className="font-serif italic">Stick photos here</p>
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
                                    <div className="absolute -bottom-4 right-10 transform rotate-12">
                                        <div className="bg-yellow-100 p-4 shadow-lg text-sm w-40 font-serif" style={{ boxShadow: '5px 5px 0px rgba(0,0,0,0.1)' }}>
                                            Don't forget high res images!
                                            <div className="w-full h-4 bg-[#e8e4d0] opacity-50 absolute -top-2 left-0 rotate-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'process' && (
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold text-center font-display" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Work in Progress...</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                        const status = i === 0 ? getStepStatus('Geração de Comando')
                                            : i === 1 ? getStepStatus('Copywriting')
                                                : getStepStatus('Geração de Imagens');

                                        return (
                                            <div key={i} className={`p-6 border-2 border-slate-800 text-center relative ${status === 'running' ? 'bg-yellow-100' : 'bg-white'}`} style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 font-bold border rounded-full text-xs border-slate-800">Step {i + 1}</div>
                                                <h3 className="font-bold text-xl mb-2">{agent}</h3>
                                                <p className="font-serif italic text-slate-500">{status}</p>
                                                {status === 'running' && <div className="mt-4 animate-bounce">✏️</div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className="relative">
                                <h2 className="text-3xl font-bold text-center font-display mb-8" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Final Masterpieces</h2>
                                <div className="bg-white p-4 shadow-[10px_10px_0px_rgba(0,0,0,0.1)] border-2 border-slate-800" style={{ borderRadius: '5px' }}>
                                    <ProductImagesGrid
                                        images={productImages}
                                        productName={formData.nome}
                                        productId={productId}
                                        onDelete={(index) => {
                                            setProductImages(prev => prev.filter((_, i) => i !== index));
                                        }}
                                    />
                                </div>
                                <div className="mt-8 flex justify-center">
                                    <Button onClick={handleNewProject} className="bg-transparent border-2 border-slate-800 text-slate-800 hover:bg-slate-100 font-bold px-8 py-6 rounded-none shadow-[5px_5px_0px_#000]">
                                        Rip Page & Start Over <RefreshCw className="ml-2 w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* FLOATING TOOLS */}
            <div className="fixed bottom-8 left-8 flex flex-col gap-4">
                <button onClick={() => setShowSettings(true)} className="p-4 bg-slate-800 text-white rounded-full shadow-lg hover:rotate-12 transition-transform transform hover:scale-110">
                    <Settings className="w-6 h-6" />
                </button>
            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="font-serif"><N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" /></DialogContent>
            </Dialog>
        </div>
    );
}
