
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw, MoreHorizontal, Share, Bell, MessageCircle, Heart, Search, ChevronDown
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

export function Variant18Pinterest({ state, actions }: VariantProps) {
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
        <div className="min-h-screen bg-white font-sans text-slate-800">

            {/* HEADER */}
            <header className="fixed top-0 left-0 w-full z-10 bg-white p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:bg-red-700 transition-colors" onClick={handleNewProject}>
                    P
                </div>
                <button onClick={() => setActiveTab('input')} className={`px-4 py-3 rounded-full font-bold ${activeTab === 'input' ? 'bg-black text-white' : 'bg-white hover:bg-slate-100'}`}>Home</button>
                <button onClick={() => isAutomationRunning && setActiveTab('process')} disabled={!isAutomationRunning} className={`px-4 py-3 rounded-full font-bold ${activeTab === 'process' ? 'bg-black text-white' : 'bg-white hover:bg-slate-100 disabled:opacity-50'}`}>Create</button>

                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search for inspiration..."
                        className="w-full bg-slate-100 hover:bg-slate-200 transition-colors rounded-full py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-100"
                    />
                </div>

                <button className="p-3 hover:bg-slate-100 rounded-full text-slate-500"><Bell className="w-6 h-6" /></button>
                <button className="p-3 hover:bg-slate-100 rounded-full text-slate-500"><MessageCircle className="w-6 h-6" /></button>
                <button onClick={() => setShowSettings(true)} className="p-3 hover:bg-slate-100 rounded-full text-slate-500"><Settings className="w-6 h-6" /></button>
                <button className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs"><ChevronDown className="w-4 h-4 text-slate-600" /></button>
            </header>
            <div className="h-20" /> {/* Spacer */}

            {/* CONTENT */}
            <div className="px-4 md:px-8 py-6 max-w-[1600px] mx-auto">

                {/* MASONRY-ISH LAYOUT (CSS columns simulated) */}
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">

                    {/* Card 1: Main Create Form (Sticky-ish look) */}
                    <div className="break-inside-avoid mb-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden group">
                            <h2 className="font-bold text-xl mb-4">Start Creating</h2>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label>Title</Label>
                                    <Input
                                        value={formData.nome}
                                        onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                        className="rounded-xl border-slate-300 h-10"
                                        placeholder="Summer Collection"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label>Code</Label>
                                        <Input
                                            value={formData.sku}
                                            onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                            className="rounded-xl border-slate-300 h-10"
                                            placeholder="SKU-001"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Price</Label>
                                        <Input
                                            type="number"
                                            value={formData.precoCusto}
                                            onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                            className="rounded-xl border-slate-300 h-10"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>About</Label>
                                    <Textarea
                                        value={formData.descricao}
                                        onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                        className="rounded-xl border-slate-300 resize-none min-h-[80px]"
                                        placeholder="Describe your pin..."
                                    />
                                </div>
                                <Button onClick={handleStartMagic} disabled={isAutomationRunning} className="w-full rounded-full bg-red-600 hover:bg-red-700 text-lg font-bold py-6">
                                    {isAutomationRunning ? "Saving..." : "Generate Pins"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Upload Area */}
                    <div className="break-inside-avoid mb-4">
                        <div className="rounded-2xl bg-slate-100 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-slate-200 transition-colors relative min-h-[300px]">
                            {productImages.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {productImages.map((img, i) => (
                                        <img key={i} src={img} className="w-full h-32 object-cover rounded-lg" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 mb-4 bg-slate-300 rounded-full flex items-center justify-center"><Upload className="w-6 h-6 text-slate-600" /></div>
                                    <h3 className="font-bold text-slate-700">Drag and drop or click to upload</h3>
                                    <p className="text-sm text-slate-500 mt-2">Recommendation: Use high-quality JPGs max 20MB</p>
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

                    {/* Card 3: Status / Feed */}
                    {isAutomationRunning && (
                        <div className="break-inside-avoid mb-4">
                            <div className="bg-black text-white rounded-2xl p-6">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Processing</h3>
                                <div className="space-y-4">
                                    {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                        const status = i === 0 ? getStepStatus('Geração de Comando')
                                            : i === 1 ? getStepStatus('Copywriting')
                                                : getStepStatus('Geração de Imagens');

                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-yellow-400 animate-pulse' : status === 'completed' ? 'bg-green-500' : 'bg-slate-600'}`} />
                                                <span className="font-medium">{agent}</span>
                                                {status === 'running' && <span className="text-xs text-slate-400 ml-auto">Working...</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generated Pins (Results) */}
                    {(productImages.length > 0) && (
                        productImages.map((img, i) => (
                            <div key={i + 'pin'} className="break-inside-avoid mb-4 group relative">
                                <img src={img} className="w-full rounded-2xl cursor-zoom-in" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl p-4 flex flex-col justify-between pointer-events-none group-hover:pointer-events-auto">
                                    <div className="flex justify-end">
                                        <Button className="rounded-full bg-red-600 hover:bg-red-700 font-bold px-6">Save</Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-slate-100"><Share className="w-4 h-4 text-black" /></button>
                                        <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-slate-100"><MoreHorizontal className="w-4 h-4 text-black" /></button>
                                    </div>
                                </div>
                                <h4 className="font-semibold text-sm mt-2 ml-1 truncate">{formData.nome || `Idea #${i + 1}`}</h4>
                                <div className="flex items-center gap-2 ml-1 mt-1">
                                    <div className="w-4 h-4 bg-slate-200 rounded-full" />
                                    <span className="text-xs text-slate-500">{formData.sku || 'MagicUser'}</span>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Placeholder Pins to fill grid */}
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="break-inside-avoid mb-4">
                            <div className="w-full h-64 bg-slate-100 rounded-2xl animate-pulse" />
                            <div className="h-4 w-2/3 bg-slate-100 rounded mt-2 ml-1" />
                        </div>
                    ))}

                </div>
            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent><N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" /></DialogContent>
            </Dialog>
        </div>
    );
}
