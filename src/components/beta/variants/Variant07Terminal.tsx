
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Terminal, Code2, Cpu, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { useMagicStudioController } from "@/hooks/useMagicStudioController";
import { useEffect, useState } from "react";

interface VariantProps {
    state: ReturnType<typeof useMagicStudioController>['state'];
    actions: ReturnType<typeof useMagicStudioController>['actions'];
}

export function Variant07Terminal({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    const [blink, setBlink] = useState(true);
    useEffect(() => {
        const interval = setInterval(() => setBlink(b => !b), 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-black font-mono text-green-500 p-4 selection:bg-green-500 selection:text-black">

            {/* CRT SCANLINE EFFECT */}
            <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />

            <header className="border-b border-green-800 pb-2 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Terminal className="w-5 h-5" />
                        MAGIC_STUDIO_V2.exe
                    </h1>
                    <p className="text-xs text-green-800">Use restricted. Authorized personnel only.</p>
                </div>
                <div className="text-xs">
                    <span className="mr-4">MEM: 64KB OK</span>
                    <span className="mr-4">CPU: 33MHz</span>
                    <button onClick={() => setShowSettings(true)} className="hover:bg-green-500 hover:text-black px-1">[CONFIG]</button>
                    <button onClick={handleNewProject} className="hover:bg-green-500 hover:text-black px-1 ml-2">[RESET]</button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="mb-8 p-2 border border-green-900 bg-green-950/20">
                    <p className="text-sm">
                        Welcome to the Magic Studio Interface.<br />
                        Current Session ID: {productId}<br />
                        Status: <span className={isAutomationRunning ? "animate-pulse" : ""}>{isAutomationRunning ? "PROCESSING..." : "IDLE"}</span>
                    </p>
                </div>

                <div className="grid grid-cols-[200px_1fr] gap-8">

                    {/* SIDE MENU */}
                    <nav className="border-r border-green-900 pr-4 space-y-2">
                        <div className="text-xs font-bold text-green-800 mb-2">-- MODULES --</div>
                        <button onClick={() => setActiveTab('input')} className={`block w-full text-left px-2 py-1 text-sm ${activeTab === 'input' ? 'bg-green-500 text-black' : 'hover:bg-green-900/30'}`}>
                            &gt; INPUT_DATA
                        </button>
                        <button onClick={() => isAutomationRunning && setActiveTab('process')} disabled={!isAutomationRunning} className={`block w-full text-left px-2 py-1 text-sm ${activeTab === 'process' ? 'bg-green-500 text-black' : 'hover:bg-green-900/30 disabled:opacity-30'}`}>
                            &gt; PROCESS_LOG
                        </button>
                        <button onClick={() => productImages.length > 0 && setActiveTab('results')} disabled={productImages.length === 0} className={`block w-full text-left px-2 py-1 text-sm ${activeTab === 'results' ? 'bg-green-500 text-black' : 'hover:bg-green-900/30 disabled:opacity-30'}`}>
                            &gt; OUTPUT_DIR
                        </button>
                    </nav>

                    {/* CONTENT AREA */}
                    <div className="min-h-[600px]">

                        {activeTab === 'input' && (
                            <div className="space-y-6">
                                <div className="border border-green-800 p-4">
                                    <h3 className="text-lg font-bold border-b border-green-800 mb-4 pb-1">1. UPLOAD ASSETS</h3>
                                    <div className="border border-dashed border-green-700 p-4 text-center cursor-pointer hover:bg-green-900/20 relative group">
                                        {productImages.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {productImages.map((img, i) => (
                                                    <div key={i} className="border border-green-600 p-1">
                                                        <img src={img} className="grayscale contrast-125 w-full h-20 object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8">
                                                <p className="text-sm">[DROP_FILES_HERE]</p>
                                                <p className="text-xs text-green-800">Or click to execute file picker</p>
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

                                <div className="border border-green-800 p-4">
                                    <h3 className="text-lg font-bold border-b border-green-800 mb-4 pb-1">2. PARAMETERS</h3>
                                    <div className="space-y-4 max-w-lg">
                                        <div className="flex items-center gap-4">
                                            <label className="w-32 text-xs uppercase">Target Name:</label>
                                            <input
                                                value={formData.nome}
                                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                className="bg-black border-b border-green-500 text-green-500 focus:outline-none flex-1 font-mono py-1 px-2"
                                                placeholder="_"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="w-32 text-xs uppercase">Serial (SKU):</label>
                                            <input
                                                value={formData.sku}
                                                onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                className="bg-black border-b border-green-500 text-green-500 focus:outline-none flex-1 font-mono py-1 px-2"
                                                placeholder="_"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="w-32 text-xs uppercase">Unit Cost:</label>
                                            <input
                                                type="number"
                                                value={formData.precoCusto}
                                                onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                className="bg-black border-b border-green-500 text-green-500 focus:outline-none flex-1 font-mono py-1 px-2"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <label className="w-32 text-xs uppercase mt-2">Extra Data:</label>
                                            <textarea
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                className="bg-black border border-green-800 text-green-500 focus:border-green-500 focus:outline-none flex-1 font-mono p-2 h-24"
                                                placeholder="> Enter data stream..."
                                            />
                                        </div>

                                        <button
                                            onClick={handleStartMagic}
                                            disabled={isAutomationRunning}
                                            className="w-full border border-green-500 py-3 text-center uppercase tracking-widest hover:bg-green-500 hover:text-black font-bold disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-green-500"
                                        >
                                            {isAutomationRunning ? `EXECUTING${blink ? '_' : ''}` : `[ INITIATE_PROTOCOL ]`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'process' && (
                            <div className="border border-green-800 p-4 h-full font-mono text-sm leading-6">
                                <div className="mb-4 text-green-300">
                                    *** PROCESS MONITOR ***<br />
                                    PID: {Math.floor(Math.random() * 9999)}<br />
                                    USER: ADMIN
                                </div>
                                {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                    const status = i === 0 ? getStepStatus('Geração de Comando')
                                        : i === 1 ? getStepStatus('Copywriting')
                                            : getStepStatus('Geração de Imagens');
                                    return (
                                        <div key={i} className="mb-2">
                                            <span className="text-green-700">{`[${i + 1}]`}</span> checking module {agent}... <span className={status === 'running' ? 'bg-green-500 text-black px-1' : status === 'completed' ? 'text-green-300' : 'text-green-900'}>{status.toUpperCase()}</span>
                                            {status === 'running' && <span className="ml-2 animate-pulse">▐</span>}
                                        </div>
                                    )
                                })}
                                <div className="mt-4 text-green-800 animate-pulse">
                                    {isAutomationRunning ? "_ waiting for remote server response..." : "_ process idle."}
                                </div>
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className="border border-green-800 p-4">
                                <h3 className="text-lg font-bold border-b border-green-800 mb-4 pb-1">3. OUTPUT MATRIX</h3>
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

            {/* Matrix Rain Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-black border border-green-500 text-green-500 font-mono rounded-none">
                    <DialogHeader><DialogTitle>&gt; SYSTEM_CONFIG</DialogTitle></DialogHeader>
                    <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                </DialogContent>
            </Dialog>

        </div>
    );
}

