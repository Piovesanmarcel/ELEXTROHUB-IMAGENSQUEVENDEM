
import {
    Sparkles, Cpu, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, MoveRight
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

export function Variant02Swiss({ state, actions }: VariantProps) {
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
        <div className="min-h-screen bg-white font-sans text-black selection:bg-black selection:text-white">

            {/* HEADER: Brutally minimal */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white border-b-2 border-black h-20 flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl rounded-none">
                        M
                    </div>
                    <span className="font-bold text-2xl tracking-tighter uppercase">Magic Studio <span className="text-red-600">02</span></span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center border-b border-black pb-1">
                        <Search className="w-4 h-4 mr-2" />
                        <input className="bg-transparent border-none outline-none text-sm w-48 font-medium placeholder:text-gray-400" placeholder="TYPE TO SEARCH" />
                    </div>

                    <Dialog open={showSettings} onOpenChange={setShowSettings}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="rounded-none hover:bg-gray-100 uppercase font-bold tracking-wider text-xs">
                                Settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-none border-2 border-black p-0 overflow-hidden">
                            <div className="bg-black text-white p-6">
                                <DialogTitle className="text-4xl font-bold tracking-tighter">SETTINGS.</DialogTitle>
                                <DialogDescription className="text-gray-400 text-lg">System configuration.</DialogDescription>
                            </div>
                            <div className="p-6">
                                <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button className="rounded-none bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider h-10 px-6" onClick={handleNewProject}>
                        Reset
                    </Button>
                </div>
            </header>

            <main className="pt-32 px-8 max-w-[1920px] mx-auto pb-20">

                {/* HERO: Huge Typography */}
                <div className="mb-24 grid grid-cols-12 gap-8 border-b-2 border-black pb-12">
                    <div className="col-span-12 lg:col-span-8">
                        <h1 className="text-8xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-6">
                            CREATE.<br />
                            AUTOMATE.<br />
                            <span className="text-outline text-transparent stroke-black stroke-2" style={{ WebkitTextStroke: '2px black' }}>DOMINATE.</span>
                        </h1>
                    </div>
                    <div className="col-span-12 lg:col-span-4 flex flex-col justify-end items-start border-l-2 border-black pl-8">
                        <p className="text-xl font-medium max-w-sm leading-tight mb-8">
                            The International Typographic Style, also known as the Swiss Style, emphasizes cleanliness, readability, and objectivity.
                        </p>
                        <div className="w-full h-2 bg-black mb-2" />
                        <div className="w-2/3 h-2 bg-red-600" />
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-16">
                    <div className="border-b-2 border-black sticky top-20 bg-white z-40 py-4">
                        <TabsList className="bg-transparent p-0 gap-8 h-auto">
                            <TabsTrigger value="input" className="rounded-none bg-transparent p-0 text-xl font-bold uppercase tracking-tight data-[state=active]:text-red-600 data-[state=active]:underline decoration-4 underline-offset-8 transition-none border-none shadow-none">01. Workspace</TabsTrigger>
                            <TabsTrigger value="process" className="rounded-none bg-transparent p-0 text-xl font-bold uppercase tracking-tight data-[state=active]:text-red-600 data-[state=active]:underline decoration-4 underline-offset-8 transition-none border-none shadow-none disabled:opacity-30" disabled={!isAutomationRunning && activeTab === 'input'}>02. Processing</TabsTrigger>
                            <TabsTrigger value="results" className="rounded-none bg-transparent p-0 text-xl font-bold uppercase tracking-tight data-[state=active]:text-red-600 data-[state=active]:underline decoration-4 underline-offset-8 transition-none border-none shadow-none disabled:opacity-30" disabled={productImages.length === 0}>03. Gallery</TabsTrigger>
                            <TabsTrigger value="pricing" className="rounded-none bg-transparent p-0 text-xl font-bold uppercase tracking-tight data-[state=active]:text-red-600 data-[state=active]:underline decoration-4 underline-offset-8 transition-none border-none shadow-none disabled:opacity-30" disabled={productImages.length === 0}>04. Finance</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="input" className="animate-in slide-in-from-right-10 duration-500">
                        <div className="grid grid-cols-12 gap-0 border-2 border-black">
                            {/* LEFT: UPLOAD */}
                            <div className="col-span-12 md:col-span-5 lg:col-span-4 border-r-2 border-black p-8 bg-gray-50">
                                <h3 className="text-3xl font-bold uppercase tracking-tighter mb-8 flex items-center gap-4">
                                    <span className="bg-black text-white w-8 h-8 flex items-center justify-center text-sm rounded-full">A</span> Upload
                                </h3>

                                <div className="border-2 border-black bg-white aspect-[3/4] relative hover:bg-red-50 transition-colors cursor-pointer group">
                                    {productImages.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-0 h-full overflow-hidden">
                                            {productImages.map((img, i) => (
                                                <div key={i} className="border-b border-r border-black overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-500">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                            <Upload className="w-16 h-16 stroke-1 mb-4" />
                                            <h4 className="font-bold text-xl uppercase">Drop files</h4>
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
                                <p className="mt-4 font-mono text-xs uppercase text-gray-500">Supported formats: JPG, PNG, WEBP. Max size: 25MB.</p>
                            </div>

                            {/* RIGHT: FORM */}
                            <div className="col-span-12 md:col-span-7 lg:col-span-8 p-12">
                                <div className="max-w-3xl">
                                    <h3 className="text-3xl font-bold uppercase tracking-tighter mb-12 flex items-center gap-4">
                                        <span className="bg-black text-white w-8 h-8 flex items-center justify-center text-sm rounded-full">B</span> Data Input
                                    </h3>

                                    <div className="space-y-12">
                                        <div className="grid grid-cols-1 group">
                                            <Label className="text-sm font-bold uppercase tracking-widest mb-2 group-focus-within:text-red-600 transition-colors">Product Name</Label>
                                            <Input
                                                value={formData.nome}
                                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                                className="h-20 text-4xl font-black rounded-none border-0 border-b-4 border-black bg-transparent px-0 focus-visible:ring-0 focus-visible:border-red-600 placeholder:text-gray-200"
                                                placeholder="PRODUCT NAME"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-12">
                                            <div className="group">
                                                <Label className="text-sm font-bold uppercase tracking-widest mb-2 group-focus-within:text-red-600">SKU Code</Label>
                                                <Input
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                    className="h-16 text-2xl font-mono rounded-none border-0 border-b-2 border-gray-300 bg-transparent px-0 focus-visible:ring-0 focus-visible:border-black"
                                                    placeholder="SKU-000"
                                                />
                                            </div>
                                            <div className="group">
                                                <Label className="text-sm font-bold uppercase tracking-widest mb-2 group-focus-within:text-red-600">Base Cost</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.precoCusto}
                                                    onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                    className="h-16 text-2xl font-mono rounded-none border-0 border-b-2 border-gray-300 bg-transparent px-0 focus-visible:ring-0 focus-visible:border-black"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <Label className="text-sm font-bold uppercase tracking-widest mb-2 group-focus-within:text-red-600">Details</Label>
                                            <Textarea
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                className="rounded-none border-2 border-gray-200 bg-transparent min-h-[150px] resize-none focus-visible:ring-0 focus-visible:border-black p-6 font-medium text-lg"
                                                placeholder="Add relevant product details here..."
                                            />
                                        </div>

                                        <Button
                                            onClick={handleStartMagic}
                                            disabled={isAutomationRunning}
                                            className="w-full h-24 rounded-none bg-black hover:bg-red-600 text-white text-3xl font-bold uppercase tracking-tighter transition-all hover:pl-8 flex justify-between items-center px-12"
                                        >
                                            {isAutomationRunning ? "Processing..." : "Generate Assets"}
                                            <ArrowRight className="w-8 h-8" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="process" className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black">
                            {['ATLAS', 'LYRA', 'ORION'].map((agentName, idx) => {
                                const status = idx === 0 ? getStepStatus('Geração de Comando')
                                    : idx === 1 ? getStepStatus('Copywriting')
                                        : getStepStatus('Geração de Imagens');

                                return (
                                    <div key={idx} className={`p-12 border-b md:border-b-0 md:border-r border-black last:border-r-0 relative overflow-hidden ${status === 'running' ? 'bg-red-600 text-white' : 'bg-white'}`}>
                                        <h3 className="font-black text-6xl tracking-tighter mb-4 opacity-20 absolute -right-4 -top-4">{idx + 1}</h3>
                                        <h3 className="font-black text-3xl tracking-tight mb-2 uppercase">{agentName}</h3>
                                        <div className="w-12 h-2 bg-current mb-6" />
                                        <p className="font-mono text-sm uppercase tracking-widest">{status}</p>
                                        {status === 'running' && <Loader2 className="w-8 h-8 mt-8 animate-spin" />}
                                    </div>
                                )
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="results">
                        <div className="border-2 border-black p-8">
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
