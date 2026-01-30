
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw, Layers,
    Package, Search, ArrowRight, Grid, Home, BarChart3, PieChart, Users, LineChart
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

export function Variant16Dashboard({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    // Mock Data for Charts
    const stats = [
        { label: "Total Generated", value: productImages.length > 0 ? productImages.length + 124 : 124, change: "+12%" },
        { label: "Avg. Engagement", value: "4.8/5", change: "+0.4" },
        { label: "Credits Used", value: "850", change: "-20" },
        { label: "Efficiency", value: "98%", change: "+2%" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">

            {/* SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">M</div>
                        <span className="font-bold text-lg tracking-tight">MagicAnalytics</span>
                    </div>

                    <nav className="space-y-1">
                        <button onClick={() => setActiveTab('input')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === 'input' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                            <Home className="w-4 h-4" />
                            <span className="text-sm font-medium">Overview</span>
                        </button>
                        <button onClick={() => isAutomationRunning && setActiveTab('process')} disabled={!isAutomationRunning} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === 'process' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30'}`}>
                            <Zap className="w-4 h-4" />
                            <span className="text-sm font-medium">Live Ops</span>
                        </button>
                        <button onClick={() => setActiveTab('results')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === 'results' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Assets</span>
                        </button>
                        <div className="pt-4 pb-2">
                            <span className="text-xs uppercase text-slate-500 font-bold px-3">Reports</span>
                        </div>
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-sm font-medium">Performance</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Audience</span>
                        </button>
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-slate-800">
                    <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="pl-64 flex-1 flex flex-col min-w-0">

                {/* TOP HEADER */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h1 className="font-bold text-lg text-slate-800">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">
                            Status: <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online</span>
                        </div>
                        <Button size="sm" onClick={handleNewProject}>New Campaign</Button>
                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                    </div>
                </header>

                <div className="p-8 space-y-8 overflow-y-auto">

                    {/* STATS CARDS */}
                    <div className="grid grid-cols-4 gap-4">
                        {stats.map((s, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <p className="text-xs font-medium text-slate-500 uppercase">{s.label}</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-2xl font-bold text-slate-900">{s.value}</span>
                                    <span className={`text-xs font-medium ${s.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>{s.change}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DASHBOARD CONTENT SWITCHER */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[500px]">

                        {activeTab === 'input' && (
                            <div className="flex flex-col md:flex-row h-full">
                                {/* Left Panel: Form */}
                                <div className="w-full md:w-1/3 p-6 border-r border-slate-200">
                                    <h2 className="font-bold text-lg mb-6">Campaign Input</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-xs uppercase text-slate-500 mb-1 block">Campaign Name</Label>
                                            <Input
                                                value={formData.nome}
                                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs uppercase text-slate-500 mb-1 block">SKU</Label>
                                                <Input
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs uppercase text-slate-500 mb-1 block">Cost Cap</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.precoCusto}
                                                    onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs uppercase text-slate-500 mb-1 block">Briefing</Label>
                                            <Textarea
                                                value={formData.descricao}
                                                onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                                className="min-h-[120px]"
                                            />
                                        </div>
                                        <Button onClick={handleStartMagic} disabled={isAutomationRunning} className="w-full bg-blue-600 hover:bg-blue-700">
                                            {isAutomationRunning ? "Executing..." : "Run Analysis & Generate"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Right Panel: Upload & Preview */}
                                <div className="flex-1 p-6 bg-slate-50">
                                    <h2 className="font-bold text-lg mb-6">Media Assets</h2>

                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center bg-white min-h-[300px] relative">
                                        {productImages.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-4 w-full">
                                                {productImages.map((img, i) => (
                                                    <div key={i} className="group relative">
                                                        <img src={img} className="w-full h-32 object-cover rounded-md shadow-sm" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center text-white text-xs">
                                                            ID: {i + 1}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="w-full h-32 border border-slate-200 rounded-md flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer relative">
                                                    <span className="text-4xl">+</span>
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
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Upload className="w-8 h-8" />
                                                </div>
                                                <h3 className="font-bold text-slate-800">Upload Source Files</h3>
                                                <p className="text-slate-500 text-sm mt-1 mb-4">JPG, PNG supported</p>
                                                <Button variant="outline" className="relative">
                                                    Browse Files
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
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'process' && (
                            <div className="p-6">
                                <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-orange-500" /> Real-time Operations</h2>

                                <div className="space-y-4">
                                    {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                        const status = i === 0 ? getStepStatus('Geração de Comando')
                                            : i === 1 ? getStepStatus('Copywriting')
                                                : getStepStatus('Geração de Imagens');

                                        return (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-3 h-3 rounded-full ${status === 'running' ? 'bg-orange-500 animate-pulse' : status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                    <span className="font-mono font-medium">{agent}_AGENT_V2.1</span>
                                                </div>
                                                <div className="font-mono text-xs text-slate-500 uppercase">
                                                    STATUS: {status}
                                                </div>
                                                <div className="w-1/3 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full bg-blue-600 transition-all duration-1000 ${status === 'completed' ? 'w-full' : status === 'running' ? 'w-1/2 animate-pulse' : 'w-0'}`} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="mt-8 p-4 bg-black text-emerald-400 font-mono text-xs rounded h-64 overflow-hidden">
                                    <p className="opacity-50"># SYSTEM LOG START</p>
                                    <p>&gt; Initializing connection to Neural Engine...</p>
                                    {isAutomationRunning && (
                                        <>
                                            <p>&gt; Job dispatched to N8N Cluster A</p>
                                            <p>&gt; Validating input parameters... OK</p>
                                            <p>&gt; Agents spun up: 3/3</p>
                                            <p>&gt; Processing...</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="font-bold text-lg">Asset Library</h2>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">Filter</Button>
                                        <Button variant="outline" size="sm">Export All</Button>
                                    </div>
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
            </main>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="max-w-2xl"><N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" /></DialogContent>
            </Dialog>
        </div>
    );
}
