
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Move, Maximize, Minus, Plus, MousePointer2
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

export function Variant06Canvas({ state, actions }: VariantProps) {
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
        <div className="min-h-screen bg-[#f0f2f5] font-sans text-slate-800 overflow-hidden relative selection:bg-yellow-200">

            {/* DOT GRID BACKGROUND */}
            <div
                className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />

            {/* FLOATING CONTROLS BOTTOM RIGHT */}
            <div className="fixed bottom-8 right-24 z-50 flex flex-col gap-2">
                <div className="bg-white shadow-xl p-2 rounded-lg flex flex-col gap-2 border border-slate-200">
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Plus className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Minus className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Maximize className="w-4 h-4" /></Button>
                </div>
            </div>

            {/* TOP BAR FLOATING */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg rounded-full px-6 py-2 flex items-center gap-6 border border-slate-200 max-w-[90vw] overflow-x-auto">
                <div className="flex items-center gap-2 font-bold text-slate-800 pr-4 border-r border-slate-200">
                    <div className="bg-yellow-400 p-1 rounded"><Grid className="w-4 h-4 text-black" /></div>
                    MagicBoard
                </div>

                <div className="flex gap-1">
                    <Button
                        variant={activeTab === 'input' ? 'secondary' : 'ghost'}
                        onClick={() => setActiveTab('input')}
                        className="rounded-full text-xs font-bold"
                    >
                        1. Input Data
                    </Button>
                    <div className="text-slate-300">→</div>
                    <Button
                        variant={activeTab === 'process' ? 'secondary' : 'ghost'}
                        onClick={() => isAutomationRunning && setActiveTab('process')}
                        className="rounded-full text-xs font-bold"
                        disabled={!isAutomationRunning}
                    >
                        2. Process Flow
                    </Button>
                    <div className="text-slate-300">→</div>
                    <Button
                        variant={activeTab === 'results' ? 'secondary' : 'ghost'}
                        onClick={() => productImages.length > 0 && setActiveTab('results')}
                        className="rounded-full text-xs font-bold"
                        disabled={productImages.length === 0}
                    >
                        3. Gallery Board
                    </Button>
                </div>

                <div className="pl-4 border-l border-slate-200 flex items-center gap-2">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">You</div>
                        <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">AI</div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full h-8 text-xs ml-2" onClick={() => setShowSettings(true)}>Share</Button>
                </div>
            </div>

            {/* CANVAS CONTENT - SIMULATING INFINITE CANVAS ITEMS */}
            <div className="relative z-10 w-full h-screen p-20 overflow-y-auto">

                <div className="max-w-6xl mx-auto min-h-[800px] relative">

                    {/* ITEM 1: STICKY NOTE INTRO */}
                    <div className="absolute top-0 -left-12 -rotate-3 bg-yellow-100 shadow-md p-6 w-64 h-64 flex flex-col justify-between transform transition-transform hover:scale-110 hover:z-50 cursor-move">
                        <p className="font-handwriting text-xl text-slate-700 leading-relaxed">
                            Start by dragging your product images onto the board! The AI is waiting...
                        </p>
                        <div className="text-xs text-slate-400 font-bold self-end">@System</div>
                    </div>

                    {/* TAB CONTENT AREA - THE "BOARD" */}
                    <div className="ml-64 mt-10">
                        {activeTab === 'input' && (
                            <div className="flex flex-wrap gap-12">

                                {/* UPLOAD CARD */}
                                <div className="bg-white p-6 rounded-xl shadow-xl w-[400px] border border-slate-200 transform hover:-translate-y-1 transition-all">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-500" /> Assets</h3>
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg h-[300px] flex items-center justify-center relative hover:bg-slate-100 transition-colors">
                                        {productImages.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2 p-2 w-full h-full overflow-y-auto">
                                                {productImages.map((img, i) => (
                                                    <img key={i} src={img} className="w-full rounded shadow-sm" />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <Upload className="w-8 h-8 mx-auto mb-2" />
                                                <p className="text-sm">Unknown File Type?</p>
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

                                {/* ARROW CONNECTOR */}
                                <div className="self-center hidden xl:block text-slate-300">
                                    <ArrowRight className="w-12 h-12" />
                                </div>

                                {/* DATA CARD */}
                                <div className="bg-white p-8 rounded-xl shadow-xl w-[500px] border border-slate-200 transform rotate-1 hover:rotate-0 transition-transform">
                                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500" /> Product Brief</h3>

                                    <div className="space-y-4">
                                        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                                            <label className="text-xs font-bold text-yellow-700 uppercase">Product Name</label>
                                            <Input
                                                value={formData.nome}
                                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                className="bg-transparent border-none shadow-none font-handwriting text-xl text-slate-800 focus-visible:ring-0 p-0 h-auto"
                                                placeholder="Type here..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                                <label className="text-xs font-bold text-blue-700 uppercase">SKU</label>
                                                <Input
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                    className="bg-transparent border-none shadow-none font-mono text-sm text-slate-800 focus-visible:ring-0 p-0 h-auto"
                                                    placeholder="..."
                                                />
                                            </div>
                                            <div className="p-3 bg-green-50 rounded border border-green-200">
                                                <label className="text-xs font-bold text-green-700 uppercase">Cost</label>
                                                <Input
                                                    type="number"
                                                    value={formData.precoCusto}
                                                    onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                    className="bg-transparent border-none shadow-none font-mono text-sm text-slate-800 focus-visible:ring-0 p-0 h-auto"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-3 bg-pink-50 rounded border border-pink-200">
                                            <label className="text-xs font-bold text-pink-700 uppercase">Details</label>
                                            <Textarea
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                className="bg-transparent border-none shadow-none text-sm text-slate-800 focus-visible:ring-0 p-0 min-h-[100px] resize-none"
                                                placeholder="Add sticky note details..."
                                            />
                                        </div>

                                        <Button
                                            onClick={handleStartMagic}
                                            disabled={isAutomationRunning}
                                            className="w-full bg-black text-white rounded-lg shadow-lg hover:scale-105 transition-transform font-bold"
                                        >
                                            {isAutomationRunning ? "Thinking..." : "Generate Magic"}
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        )}

                        {activeTab === 'process' && (
                            <div className="flex gap-8 justify-center items-center h-[500px]">
                                {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                    const status = i === 0 ? getStepStatus('Geração de Comando')
                                        : i === 1 ? getStepStatus('Copywriting')
                                            : getStepStatus('Geração de Imagens');

                                    return (
                                        <>
                                            <div key={i} className={`
                                        w-64 h-64 rounded-full flex flex-col items-center justify-center p-6 text-center shadow-xl border-4 transition-all
                                        ${status === 'running' ? 'bg-white border-purple-500 scale-110 animate-pulse' : 'bg-slate-100 border-slate-300'}
                                    `}>
                                                <Brain className={`w-12 h-12 mb-4 ${status === 'running' ? 'text-purple-600' : 'text-slate-400'}`} />
                                                <h3 className="font-bold text-xl">{agent}</h3>
                                                <div className="badge mt-2 px-3 py-1 bg-black text-white rounded-full text-xs font-bold uppercase">{status}</div>
                                            </div>
                                            {i < 2 && <div className="h-2 w-24 bg-slate-300 rounded-full" />}
                                        </>
                                    )
                                })}
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className="bg-white p-12 shadow-2xl rounded-3xl border border-slate-200 max-w-5xl mx-auto transform rotate-1">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                                    <h2 className="text-3xl font-bold">Final Collection</h2>
                                    <Button variant="outline" className="rounded-full">Download All</Button>
                                </div>
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

            {/* Settings Dialog Hidden */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent><N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" /></DialogContent>
            </Dialog>
        </div>
    );
}
