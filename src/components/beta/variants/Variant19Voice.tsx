
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw, Mic, MicOff, Volume2, Globe, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { useMagicStudioController } from "@/hooks/useMagicStudioController";
import { useState, useEffect } from "react";

interface VariantProps {
    state: ReturnType<typeof useMagicStudioController>['state'];
    actions: ReturnType<typeof useMagicStudioController>['actions'];
}

export function Variant19Voice({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("System Standby...");

    // Fake Voice Visualization
    useEffect(() => {
        let interval: any;
        if (isListening) {
            interval = setInterval(() => {
                const phrases = [
                    "Processing audio stream...",
                    "Scanning parameters...",
                    "Identifying product features...",
                    "Listening..."
                ];
                setTranscript(phrases[Math.floor(Math.random() * phrases.length)]);
            }, 2000);
        } else {
            setTranscript(isAutomationRunning ? "Executing Directives..." : "Awaiting Command");
        }
        return () => clearInterval(interval);
    }, [isListening, isAutomationRunning]);

    return (
        <div className="min-h-screen bg-black text-cyan-400 font-mono overflow-hidden relative selection:bg-cyan-500 selection:text-black">

            {/* GRID OVERLAY */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none" />

            {/* HEADER */}
            <header className="relative z-10 p-8 flex justify-between items-start">
                <div className="border border-cyan-500/30 bg-cyan-900/10 p-2 flex items-center gap-4 backdrop-blur-sm">
                    <Globe className="w-5 h-5 animate-pulse" />
                    <span className="text-xs tracking-[0.2em] uppercase">System Online // v2.0.4</span>
                </div>

                <div className="flex gap-4">
                    <Button onClick={() => setShowSettings(true)} variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black uppercase tracking-widest text-xs">config_sys</Button>
                    <Button onClick={handleNewProject} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black uppercase tracking-widest text-xs">reset_core</Button>
                </div>
            </header>

            {/* MAIN HUD */}
            <main className="relative z-10 container mx-auto flex flex-col items-center justify-center min-h-[60vh]">

                {/* Central Orb / Visualizer */}
                <div className="relative group">
                    <div className={`w-64 h-64 rounded-full border-2 border-cyan-500 flex items-center justify-center transition-all duration-300 ${isListening ? 'scale-110 shadow-[0_0_100px_rgba(6,182,212,0.5)]' : 'shadow-[0_0_30px_rgba(6,182,212,0.2)]'}`}>
                        <div className={`w-48 h-48 rounded-full bg-cyan-500/10 flex items-center justify-center transition-all duration-1000 ${isAutomationRunning ? 'animate-spin' : ''}`}>
                            <div className="w-32 h-32 rounded-full border border-cyan-400/50 flex items-center justify-center">
                                <button
                                    onClick={() => setIsListening(!isListening)}
                                    className="bg-cyan-500 text-black p-4 rounded-full hover:bg-white transition-colors"
                                >
                                    {isListening ? <Mic className="w-8 h-8 animate-bounce" /> : <MicOff className="w-8 h-8" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Rotating Rings */}
                    <div className="absolute inset-0 border border-dashed border-cyan-500/30 rounded-full w-[140%] h-[140%] -translate-x-[15%] -translate-y-[15%] animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-0 border border-dotted border-cyan-500/30 rounded-full w-[120%] h-[120%] -translate-x-[10%] -translate-y-[10%] animate-[spin_15s_linear_infinite_reverse]" />
                </div>

                {/* Transcript Display */}
                <div className="mt-12 text-center space-y-4 max-w-2xl bg-black/50 backdrop-blur border border-cyan-800 p-8">
                    <h2 className="text-2xl tracking-[0.2em] font-light uppercase text-cyan-200 animate-pulse">{transcript}</h2>

                    {/* Manual Fallback Inputs */}
                    <div className={`grid gap-4 transition-all duration-500 overflow-hidden ${!isListening && !isAutomationRunning ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <p className="text-xs text-cyan-700 uppercase tracking-widest border-b border-cyan-900 pb-2">Manual Override Controls</p>

                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <label className="text-[10px] uppercase text-cyan-600">Identification Code</label>
                                <input
                                    value={formData.nome}
                                    onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                    className="w-full bg-cyan-950/30 border border-cyan-800 text-cyan-300 p-2 text-sm focus:border-cyan-400 outline-none"
                                    placeholder="PRODUCT_NAME"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-cyan-600">Unit Cost</label>
                                <input
                                    value={formData.precoCusto}
                                    onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                    className="w-full bg-cyan-950/30 border border-cyan-800 text-cyan-300 p-2 text-sm focus:border-cyan-400 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {productImages.length === 0 && (
                            <div className="border border-cyan-800 border-dashed p-4 text-center cursor-pointer hover:bg-cyan-900/20 relative">
                                <Upload className="w-6 h-6 mx-auto mb-2 text-cyan-600" />
                                <span className="text-xs text-cyan-600">UPLOAD_VISUAL_DATA</span>
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
                        )}

                        {productImages.length > 0 && (
                            <div className="flex justify-center mt-4">
                                <Button onClick={handleStartMagic} className="bg-cyan-600 text-black hover:bg-white hover:text-cyan-900 font-bold uppercase tracking-widest w-full">
                                    Initiate Sequence
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

            </main>

            {/* FOOTER / RESULTS */}
            <footer className="fixed bottom-0 left-0 w-full bg-black/80 border-t border-cyan-900 backdrop-blur-md p-4 transition-transform duration-500 z-20">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-cyan-600 uppercase">output_buffer</span>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping delay-75" />
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping delay-150" />
                    </div>
                </div>

                {productImages.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                        {productImages.map((img, i) => (
                            <div key={i} className="flex-none w-32 h-20 border border-cyan-800 relative bg-cyan-900/10 hover:bg-cyan-900/30 transition-colors cursor-pointer group">
                                <img src={img} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-0 right-0 bg-cyan-600 text-black text-[10px] px-1 font-bold">IMG_0{i + 1}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-cyan-900 text-sm py-4 font-mono">NO DATA IN BUFFER</div>
                )}
            </footer>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-black border-cyan-500 text-cyan-400 font-mono"><N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" /></DialogContent>
            </Dialog>
        </div>
    );
}
