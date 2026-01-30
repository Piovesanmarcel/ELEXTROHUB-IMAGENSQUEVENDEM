
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw, Play, Info, Plus, ThumbsUp, Volume2, Search, ArrowRight
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

export function Variant17Netflix({ state, actions }: VariantProps) {
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
        <div className="min-h-screen bg-[#141414] text-white font-sans overflow-x-hidden selection:bg-red-600 selection:text-white">

            {/* NAVBAR */}
            <header className="fixed top-0 left-0 w-full z-50 px-4 md:px-12 py-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between transition-colors duration-500">
                <div className="flex items-center gap-8">
                    <h1 className="text-red-600 text-3xl font-bold tracking-tighter uppercase cursor-pointer" onClick={handleNewProject}>MAGIC</h1>
                    <nav className="hidden md:flex gap-6 text-sm font-medium">
                        <button onClick={() => setActiveTab('input')} className={`${activeTab === 'input' ? 'text-white font-bold' : 'text-gray-300 hover:text-white'} transition-colors`}>Home</button>
                        <button onClick={() => isAutomationRunning && setActiveTab('process')} disabled={!isAutomationRunning} className={`${activeTab === 'process' ? 'text-white font-bold' : 'text-gray-300 hover:text-white disabled:opacity-30'} transition-colors`}>Series</button>
                        <button onClick={() => productImages.length > 0 && setActiveTab('results')} disabled={productImages.length === 0} className={`${activeTab === 'results' ? 'text-white font-bold' : 'text-gray-300 hover:text-white disabled:opacity-30'} transition-colors`}>My List</button>
                        <button className="text-gray-300 hover:text-white transition-colors">New & Popular</button>
                    </nav>
                </div>
                <div className="flex items-center gap-6">
                    <Search className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
                    <span className="text-sm">Kids</span>
                    <Settings onClick={() => setShowSettings(true)} className="w-5 h-5 cursor-pointer hover:rotate-90 transition-transform" />
                    <div className="w-8 h-8 rounded bg-blue-600 cursor-pointer" />
                </div>
            </header>

            {/* HERO SECTION */}
            <div className="relative w-full h-[85vh]">
                {/* Background Image/Video Placeholder */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                </div>

                <div className="absolute top-[30%] left-4 md:left-12 max-w-2xl space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-red-600 w-1 h-8 shadow-[0_0_20px_rgba(220,38,38,0.7)]" />
                        <span className="text-4xl font-black tracking-widest uppercase text-gray-200">SERIES</span>
                    </div>

                    {/* Dynamic Title */}
                    <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.9] drop-shadow-2xl">
                        {formData.nome || "UNTITLED PROJECT"}
                    </h1>

                    <div className="flex items-center gap-4 text-green-400 font-bold">
                        <span>98% Match</span>
                        <span className="text-gray-400 font-normal">2024</span>
                        <span className="border border-gray-600 px-1 text-xs text-gray-300 rounded-sm">4K</span>
                        <span className="border border-gray-600 px-1 text-xs text-gray-300 rounded-sm">5.1</span>
                    </div>

                    <p className="text-lg md:text-xl text-gray-200 drop-shadow-md max-w-xl transition-all duration-300">
                        {formData.descricao ? formData.descricao.slice(0, 150) + (formData.descricao.length > 150 ? "..." : "") : "Create stunning high-conversion ads for your products using advanced AI agents. Start viewing now."}
                    </p>

                    <div className="flex gap-4 pt-4">
                        <Button
                            onClick={handleStartMagic}
                            disabled={isAutomationRunning}
                            className="bg-white text-black hover:bg-gray-200 font-bold text-xl px-8 py-6 flex items-center gap-3 transition-transform hover:scale-105"
                        >
                            {isAutomationRunning ? <Loader2 className="animate-spin w-6 h-6" /> : <Play className="fill-black w-6 h-6" />}
                            {isAutomationRunning ? "Generating..." : "Play"}
                        </Button>
                        <Button onClick={() => setShowSettings(true)} className="bg-[rgba(109,109,110,0.7)] text-white hover:bg-[rgba(109,109,110,0.4)] font-bold text-xl px-8 py-6 flex items-center gap-3 transition-transform hover:scale-105">
                            <Info className="w-6 h-6" />
                            More Info
                        </Button>
                    </div>
                </div>

                <div className="absolute bottom-[20%] right-0 w-24 h-8 border-l border-white/50 bg-black/30 flex items-center justify-center gap-2 text-white/80 text-sm font-bold uppercase backdrop-blur-sm cursor-pointer hover:bg-white/10">
                    <Volume2 className="w-4 h-4" /> 18+
                </div>
            </div>

            {/* CONTENT ROWS */}
            <div className="relative z-10 px-4 md:px-12 -mt-32 space-y-12 pb-24">

                {/* Row 1: Setup */}
                {activeTab === 'input' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#e5e5e5] hover:text-white cursor-pointer flex items-center gap-2 group">
                            Configure Campaign <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">Explore All <ArrowRight className="w-3 h-3 ml-1" /></span>
                        </h3>

                        <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar scroll-smooth">

                            {/* Upload Card */}
                            <div className="flex-none w-[300px] aspect-video bg-[#2f2f2f] rounded-md relative group cursor-pointer hover:scale-105 hover:z-20 transition-all duration-300 overflow-hidden">
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <Plus className="w-12 h-12 mb-4 group-hover:text-white transition-colors border-2 border-gray-500 rounded-full p-2" />
                                    <span className="font-bold">Add to My List</span>
                                </div>
                                {productImages.length > 0 && <img src={productImages[0]} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />}
                                <Input
                                    type="file" multiple accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
                                            handleImagesUploaded(urls);
                                        }
                                    }}
                                />
                            </div>

                            {/* Info Form Card - Simulated as a "Preview" */}
                            <div className="flex-none w-[400px] bg-[#181818] rounded-md border border-[#333] p-6 hover:scale-105 hover:z-20 transition-all duration-300 group">
                                <h4 className="text-green-500 text-xs font-bold uppercase mb-2">New Season</h4>
                                <div className="space-y-4">
                                    <Input
                                        value={formData.nome}
                                        onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                        className="bg-transparent border border-gray-700 text-white placeholder:text-gray-500 focus:border-white transition-colors"
                                        placeholder="Title (Product Name)"
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            value={formData.sku}
                                            onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                            className="bg-transparent border border-gray-700 text-white placeholder:text-gray-500"
                                            placeholder="Genre (SKU)"
                                        />
                                        <Input
                                            type="number"
                                            value={formData.precoCusto}
                                            onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                            className="bg-transparent border border-gray-700 text-white placeholder:text-gray-500"
                                            placeholder="Budget ($)"
                                        />
                                    </div>
                                    <Textarea
                                        value={formData.descricao}
                                        onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                        className="bg-transparent border border-gray-700 text-white placeholder:text-gray-500 h-20 resize-none"
                                        placeholder="Plot Summary..."
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* Row 2: Generated Content */}
                {(isAutomationRunning || productImages.length > 0) && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#e5e5e5] mb-2">Based on your selection</h3>
                        <div className="flex gap-2 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
                            {productImages.map((img, i) => (
                                <div key={i} className="flex-none w-[250px] aspect-[2/3] bg-[#2f2f2f] rounded-sm relative group cursor-pointer hover:scale-110 hover:z-20 transition-all duration-300 origin-center">
                                    <img src={img} className="w-full h-full object-cover rounded-sm" />

                                    {/* Hover Stats Card */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <div className="flex gap-2 mb-2">
                                            <button className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200"><Play className="w-4 h-4 fill-black" /></button>
                                            <button className="w-8 h-8 border-2 border-gray-400 text-white rounded-full flex items-center justify-center hover:border-white"><Plus className="w-4 h-4" /></button>
                                            <button className="w-8 h-8 border-2 border-gray-400 text-white rounded-full flex items-center justify-center hover:border-white ml-auto"><ThumbsUp className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-green-400">
                                            <span>98% Match</span>
                                            <span className="border border-gray-500 px-1 text-gray-300">HD</span>
                                        </div>
                                        <div className="flex gap-2 text-[10px] text-white mt-1">
                                            <span>Ad Creative</span>
                                            <span className="text-gray-400">•</span>
                                            <span>Social</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Row 3: Live Process */}
                {isAutomationRunning && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#e5e5e5] mb-2">Trending Now</h3>
                        <div className="flex gap-4">
                            {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => (
                                <div key={i} className="flex-none w-[300px] h-[160px] bg-[#181818] rounded border-t-2 border-red-600 p-4 relative overflow-hidden group hover:scale-105 transition-transform">
                                    <div className="absolute top-0 right-0 p-2 opacity-50 text-[100px] font-black leading-none text-gray-800 pointer-events-none -mt-4 -mr-4 select-none">{i + 1}</div>
                                    <h4 className="font-bold text-lg relative z-10">{agent}</h4>
                                    <p className="text-xs text-gray-400 relative z-10 mb-4">Season 1 • Episode {i + 1}</p>

                                    <div className="relative z-10 flex items-center gap-2">
                                        <div className="bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold">LIVE</div>
                                        <span className="text-xs font-mono">{getStepStatus(i === 0 ? 'Geração de Comando' : i === 1 ? 'Copywriting' : 'Geração de Imagens')}</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-1 mt-4 relative z-10 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-600 animate-pulse w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-[#181818] border-gray-800 text-white"><N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" /></DialogContent>
            </Dialog>
        </div>
    );
}
