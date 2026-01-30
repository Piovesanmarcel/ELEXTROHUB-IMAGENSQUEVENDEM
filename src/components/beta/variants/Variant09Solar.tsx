
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Leaf, Sun, Wind
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

export function Variant09Solar({ state, actions }: VariantProps) {
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
        <div className="min-h-screen bg-[#f3f6f1] font-sans text-[#2c4c3b] selection:bg-[#d4e6c3]">

            {/* Organic Shapes Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-50">
                <div className="absolute top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-[#e8f3d6] rounded-full blur-[80px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] bg-[#dbecc2] rounded-full blur-[100px]" />
            </div>

            <header className="relative z-10 p-6 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4a7c59] flex items-center justify-center text-white shadow-lg shadow-[#4a7c59]/20">
                        <Leaf className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-[#1a2e22]">Gaia Studio</span>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-white border border-[#cde0b8] flex items-center justify-center text-[#4a7c59] hover:bg-[#eaf4df] transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                    <Button onClick={handleNewProject} className="rounded-full bg-[#1a2e22] text-[#f3f6f1] hover:bg-[#2c4c3b] border-none shadow-xl">
                        New Cycle
                    </Button>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-[#1a2e22] mb-4">Cultivate Your Vision.</h1>
                    <p className="text-[#4a7c59] max-w-lg mx-auto leading-relaxed">Let artificial intelligence nurture your product ideas into fully grown marketing assets.</p>
                </div>

                {/* SOLAR PUNK TABS - Floating Island Style */}
                <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-3 shadow-[0_20px_40px_-15px_rgba(74,124,89,0.1)] border border-[#e2eadd] mb-12 flex justify-center w-fit mx-auto">
                    <div className="flex gap-2">
                        {['input', 'process', 'results'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'input' || isAutomationRunning || productImages.length > 0) setActiveTab(tab)
                                }}
                                className={`
                            px-8 py-3 rounded-full font-bold text-sm transition-all duration-300
                            ${activeTab === tab
                                        ? 'bg-[#4a7c59] text-white shadow-lg shadow-[#4a7c59]/30'
                                        : 'text-[#6e8c75] hover:bg-[#f0f7e6]'
                                    }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                                disabled={tab !== 'input' && !isAutomationRunning && productImages.length === 0}
                            >
                                {tab === 'input' ? 'Seed' : tab === 'process' ? 'Grow' : 'Harvest'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-[500px]">

                    {activeTab === 'input' && (
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            {/* UPLOAD - Organic blob shape container */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-[#d8eabc] rounded-[3rem] rotate-3 transform transition-transform group-hover:rotate-1" />
                                <div className="relative bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#e2eadd] h-[500px] flex flex-col items-center justify-center overflow-hidden">
                                    {productImages.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-4 w-full h-full overflow-y-auto">
                                            {productImages.map((img, i) => (
                                                <img key={i} src={img} className="rounded-2xl w-full h-32 object-cover" />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <Sun className="w-16 h-16 text-yellow-400 mb-6 drop-shadow-lg" />
                                            <h3 className="font-bold text-lg text-[#1a2e22]">Plant seeds here</h3>
                                            <p className="text-sm text-[#6e8c75] mt-2">Upload product photos</p>
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
                            <div className="space-y-8 pl-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-[#4a7c59] uppercase pl-4 mb-1 block">Product Name</label>
                                        <Input
                                            value={formData.nome}
                                            onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                            className="h-14 rounded-full border-[#cde0b8] bg-white text-lg px-6 focus:border-[#4a7c59] focus:ring-[#4a7c59]/20"
                                            placeholder="e.g. Eco-Friendly Bottle"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-[#4a7c59] uppercase pl-4 mb-1 block">SKU</label>
                                            <Input
                                                value={formData.sku}
                                                onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                className="h-14 rounded-full border-[#cde0b8] bg-white text-lg px-6 focus:border-[#4a7c59]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[#4a7c59] uppercase pl-4 mb-1 block">Cost</label>
                                            <Input
                                                type="number"
                                                value={formData.precoCusto}
                                                onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                className="h-14 rounded-full border-[#cde0b8] bg-white text-lg px-6 focus:border-[#4a7c59]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#4a7c59] uppercase pl-4 mb-1 block">Description</label>
                                        <Textarea
                                            value={formData.descricao}
                                            onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                            className="rounded-[2rem] border-[#cde0b8] bg-white px-6 py-4 focus:border-[#4a7c59] min-h-[120px]"
                                            placeholder="Describe the natural essence..."
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleStartMagic}
                                    disabled={isAutomationRunning}
                                    className="w-full h-16 rounded-full bg-gradient-to-r from-[#4a7c59] to-[#2c4c3b] hover:from-[#5d966e] hover:to-[#3a634d] text-white text-xl font-bold shadow-xl shadow-[#4a7c59]/30 transition-transform hover:-translate-y-1 block"
                                >
                                    {isAutomationRunning ? "Sunlight Processing..." : "Start Growth Cycle"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'process' && (
                        <div className="flex flex-col items-center justify-center space-y-8 py-12">
                            {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                const status = i === 0 ? getStepStatus('Geração de Comando')
                                    : i === 1 ? getStepStatus('Copywriting')
                                        : getStepStatus('Geração de Imagens');

                                return (
                                    <div key={i} className="bg-white/90 rounded-2xl p-6 w-full max-w-lg shadow-sm border border-[#e2eadd] flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${status === 'running' ? 'bg-[#d8eabc] text-[#4a7c59]' : 'bg-[#f3f6f1] text-[#a5bcae]'}`}>
                                                <Wind className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold text-[#1a2e22]">{agent} Agent</span>
                                        </div>
                                        <Badge className={status === 'completed' ? 'bg-[#4a7c59]' : 'bg-[#e2eadd] text-[#1a2e22]'}>{status}</Badge>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#e2eadd]">
                            <h2 className="text-2xl font-bold text-[#1a2e22] mb-8 text-center">Bounty Harvest</h2>
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

            </main>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-[#f3f6f1] border-[#cde0b8]">
                    <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                </DialogContent>
            </Dialog>
        </div>
    );
}
