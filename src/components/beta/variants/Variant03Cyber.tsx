
import {
    Sparkles, Cpu, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Terminal, AlertTriangle, Play
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

export function Variant03Cyber({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    // Custom Neon Input Component
    const NeonInput = (props: any) => (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <Input {...props} className={`relative bg-black text-cyan-400 border-cyan-900 placeholder:text-cyan-900/50 focus:border-cyan-400 rounded-md ${props.className}`} />
        </div>
    );

    return (
        <div className="min-h-screen bg-black font-mono text-cyan-500 selection:bg-cyan-500 selection:text-black overflow-x-hidden">

            {/* Grid Background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_90%)] pointer-events-none" />

            {/* HEADER */}
            <header className="fixed top-0 left-0 w-full z-50 bg-black/90 border-b border-cyan-900/50 backdrop-blur-sm h-16 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
                    <span className="font-bold text-xl tracking-widest text-white uppercase glitch-text">
                        Magic<span className="text-cyan-500">_Net</span> v3.0
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-cyan-950/30 border border-cyan-900/50 px-3 py-1 rounded-sm">
                        <span className="text-[10px] text-cyan-700 mr-2">STATUS:</span>
                        <span className="text-xs text-green-500 animate-pulse">ONLINE</span>
                    </div>

                    <Dialog open={showSettings} onOpenChange={setShowSettings}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-cyan-700 text-cyan-500 hover:bg-cyan-900/20 hover:text-cyan-400 uppercase text-xs tracking-widest">
                                Config.sys
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black/90 border border-cyan-500 text-cyan-500 font-mono">
                            <DialogHeader>
                                <DialogTitle className="text-yellow-500 uppercase flex items-center gap-2"><Settings className="w-4 h-4" /> System Config</DialogTitle>
                                <DialogDescription className="text-cyan-800">Manage neural links and webhooks.</DialogDescription>
                            </DialogHeader>
                            <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                        </DialogContent>
                    </Dialog>

                    <Button size="sm" className="bg-red-600/20 text-red-500 border border-red-600 hover:bg-red-600 hover:text-white uppercase tracking-widest text-xs" onClick={handleNewProject}>
                        Kill_Process
                    </Button>
                </div>
            </header>

            {/* Decorative Scanlines */}
            <div className="fixed top-24 right-10 w-48 h-24 border border-cyan-900/30 p-2 text-[10px] text-cyan-900 opacity-50 hidden lg:block">
                <p>MEM: 64TB</p>
                <p>CPU: 98%</p>
                <p>NET: SECURE</p>
                <div className="w-full bg-cyan-900/20 h-1 mt-2 mb-1"><div className="w-[70%] bg-cyan-700 h-full animate-pulse" /></div>
                <p>DAEMON: RUNNING</p>
            </div>

            <main className="relative z-10 pt-24 px-6 max-w-7xl mx-auto pb-20">

                <div className="mb-12 border-l-4 border-yellow-500 pl-6 py-2">
                    <h1 className="text-5xl font-bold text-white mb-2 uppercase tracking-tighter">
                        Neural <span className="text-yellow-500">Ad_Gen</span>
                    </h1>
                    <p className="text-cyan-700 font-bold uppercase tracking-widest text-sm">
                // System Output: High Conversion Assets
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="flex gap-4 mb-8">
                        <TabsList className="bg-black border border-cyan-900 p-1 gap-2 h-auto">
                            <TabsTrigger value="input" className="bg-transparent text-cyan-800 data-[state=active]:bg-cyan-900/30 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500 border border-transparent uppercase font-bold tracking-widest text-xs py-2 px-6">Input_Stream</TabsTrigger>
                            <TabsTrigger value="process" className="bg-transparent text-cyan-800 data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500 border border-transparent uppercase font-bold tracking-widest text-xs py-2 px-6 disabled:opacity-30" disabled={!isAutomationRunning && activeTab === 'input'}>Processing_Unit</TabsTrigger>
                            <TabsTrigger value="results" className="bg-transparent text-cyan-800 data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400 data-[state=active]:border-green-500 border border-transparent uppercase font-bold tracking-widest text-xs py-2 px-6 disabled:opacity-30" disabled={productImages.length === 0}>Data_Bank</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="input" className="animate-in fade-in duration-300">
                        <div className="grid md:grid-cols-12 gap-8">
                            {/* UPLOAD - Cyber Frame */}
                            <div className="md:col-span-5 relative">
                                <div className="absolute -inset-1 bg-gradient-to-b from-cyan-500 to-purple-600 opacity-20 blur-sm rounded-lg" />
                                <div className="relative bg-black border border-cyan-800 h-[500px] p-1 clip-path-polygon">
                                    {/* Corner decorations */}
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500" />
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500" />
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500" />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500" />

                                    <div className="bg-cyan-950/20 h-full w-full p-4 relative overflow-hidden group">
                                        {productImages.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2 h-full content-start overflow-y-auto custom-scrollbar">
                                                {productImages.map((img, i) => (
                                                    <div key={i} className="aspect-square border border-cyan-900/50 p-1 bg-black/50">
                                                        <img src={img} className="w-full h-full object-cover filter contrast-125 hover:brightness-125 transition-all" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-cyan-800">
                                                <Upload className="w-16 h-16 opacity-50 mb-4 animate-pulse" />
                                                <p className="text-sm font-bold uppercase tracking-widest">[NO DATA INPUT]</p>
                                                <p className="text-xs mt-2">Upload visual assets required.</p>
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
                            </div>

                            {/* FORM - Terminal Interface */}
                            <div className="md:col-span-7 space-y-6">
                                <div className="border-l-2 border-cyan-500 pl-4 py-2 bg-gradient-to-r from-cyan-900/10 to-transparent">
                                    <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
                                        <Terminal className="w-5 h-5 text-cyan-500" />
                                        Command_Line_Input
                                    </h2>
                                </div>

                                <div className="space-y-6 max-w-2xl">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-cyan-700 uppercase font-bold">Target_ID (Name)</Label>
                                        <NeonInput
                                            value={formData.nome}
                                            onChange={(e: any) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                            placeholder="ENTER_PRODUCT_DESIGNATION"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-cyan-700 uppercase font-bold">Serial_Key (SKU)</Label>
                                            <NeonInput
                                                value={formData.sku}
                                                onChange={(e: any) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                placeholder="XXX-000"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-cyan-700 uppercase font-bold">Unit_Cost</Label>
                                            <NeonInput
                                                type="number"
                                                value={formData.precoCusto}
                                                onChange={(e: any) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                placeholder="0000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-cyan-700 uppercase font-bold">Parameter_Override (Desc)</Label>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-cyan-800 rounded-lg blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                                            <Textarea
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                className="relative bg-black text-cyan-400 border-cyan-900 placeholder:text-cyan-900/50 focus:border-cyan-400 rounded-md min-h-[120px] font-mono"
                                                placeholder="> Input extra data parameters..."
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleStartMagic}
                                        disabled={isAutomationRunning}
                                        className="w-full h-16 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] tracking-tighter clip-path-slant"
                                    >
                                        {isAutomationRunning ? "EXECUTING..." : ">> INITIALIZE PROTOCOL"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="process" className="space-y-8">
                        <div className="grid grid-cols-1 gap-4">
                            {['ATLAS', 'LYRA', 'ORION'].map((agentName, idx) => {
                                const status = idx === 0 ? getStepStatus('Geração de Comando')
                                    : idx === 1 ? getStepStatus('Copywriting')
                                        : getStepStatus('Geração de Imagens');

                                return (
                                    <div key={idx} className={`border border-cyan-900 p-4 flex items-center justify-between ${status === 'running' ? 'bg-cyan-950/20 border-cyan-500' : 'bg-black'} transition-all`}>
                                        <div className="flex items-center gap-4">
                                            {status === 'running' && <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />}
                                            {status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                            {status === 'idle' && <AlertTriangle className="w-5 h-5 text-cyan-900" />}

                                            <div>
                                                <h3 className="font-bold text-lg text-white">{agentName}_MODULE</h3>
                                                <p className="text-xs text-cyan-700 uppercase">[PROCESS_PID_{1000 + idx}]</p>
                                            </div>
                                        </div>
                                        <div className="font-mono text-xs uppercase text-cyan-500">
                                            STATUS: {status}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="results">
                        <div className="border border-cyan-800 bg-black/50 p-6 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                            <ProductImagesGrid
                                images={productImages}
                                productName={formData.nome}
                                productId={productId}
                                onDelete={(index) => {
                                    setProductImages(prev => prev.filter((_, i) => i !== index));
                                }}
                            />
                        </div>
                    </TabsContent>

                </Tabs>
            </main>
        </div>
    );
}
