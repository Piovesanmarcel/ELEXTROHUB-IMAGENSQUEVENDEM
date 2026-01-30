
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Monitor, Disc, X, Minus, Square
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

export function Variant11Retro({ state, actions }: VariantProps) {
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
        <div className="min-h-screen bg-[#008080] font-mono text-black p-4 md:p-8 flex items-center justify-center selection:bg-blue-800 selection:text-white">

            {/* WINDOW FRAME */}
            <div className="bg-[#c0c0c0] p-1 shadow-[2px_2px_0px_#ffffff,-2px_-2px_0px_#000000] w-full max-w-5xl h-[85vh] flex flex-col">

                {/* TITLE BAR */}
                <div className="bg-[#000080] px-2 py-1 flex justify-between items-center text-white mb-1">
                    <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <span className="font-bold tracking-wider text-sm">Magic Studio 95.exe</span>
                    </div>
                    <div className="flex gap-1">
                        <button className="bg-[#c0c0c0] p-0.5 w-5 h-5 flex items-center justify-center border-t border-l border-white border-b border-r border-black shadow-sm active:border-l-black active:border-t-black active:border-r-white active:border-b-white active:shadow-none"><Minus className="w-3 h-3 text-black" /></button>
                        <button className="bg-[#c0c0c0] p-0.5 w-5 h-5 flex items-center justify-center border-t border-l border-white border-b border-r border-black shadow-sm active:border-l-black active:border-t-black active:border-r-white active:border-b-white active:shadow-none"><Square className="w-3 h-3 text-black" /></button>
                        <button className="bg-[#c0c0c0] p-0.5 w-5 h-5 flex items-center justify-center border-t border-l border-white border-b border-r border-black shadow-sm active:border-l-black active:border-t-black active:border-r-white active:border-b-white active:shadow-none"><X className="w-3 h-3 text-black" /></button>
                    </div>
                </div>

                {/* MENUBAR */}
                <div className="px-2 py-1 flex gap-4 text-sm mb-4">
                    <span className="underline cursor-pointer hover:bg-[#000080] hover:text-white px-1">F</span>ile
                    <span className="underline cursor-pointer hover:bg-[#000080] hover:text-white px-1">E</span>dit
                    <span className="underline cursor-pointer hover:bg-[#000080] hover:text-white px-1" onClick={() => setShowSettings(true)}>S</span>ettings
                    <span className="underline cursor-pointer hover:bg-[#000080] hover:text-white px-1">H</span>elp
                </div>

                {/* MAIN CONTENT AREA - SUNKEN */}
                <div className="flex-1 bg-white border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-white p-6 overflow-y-auto m-1 relative">

                    {/* RETRO TABS */}
                    <div className="flex border-b border-black mb-6">
                        <button onClick={() => setActiveTab('input')} className={`px-4 py-1 border-t border-l border-r border-black -mb-[1px] ${activeTab === 'input' ? 'bg-white font-bold pb-2 z-10' : 'bg-[#c0c0c0] text-[#555]'}`}>
                            Input.dat
                        </button>
                        <button onClick={() => isAutomationRunning && setActiveTab('process')} disabled={!isAutomationRunning} className={`px-4 py-1 border-t border-l border-r border-black -mb-[1px] ml-[-1px] ${activeTab === 'process' ? 'bg-white font-bold pb-2 z-10' : 'bg-[#c0c0c0] text-[#555] disabled:opacity-50'}`}>
                            Process.exe
                        </button>
                        <button onClick={() => productImages.length > 0 && setActiveTab('results')} disabled={productImages.length === 0} className={`px-4 py-1 border-t border-l border-r border-black -mb-[1px] ml-[-1px] ${activeTab === 'results' ? 'bg-white font-bold pb-2 z-10' : 'bg-[#c0c0c0] text-[#555] disabled:opacity-50'}`}>
                            Output_Dir
                        </button>
                    </div>

                    {activeTab === 'input' && (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* UPLOAD AREA */}
                            <fieldset className="border border-black p-4 relative group">
                                <legend className="px-2 font-bold">Assets Source</legend>
                                <div className="bg-[#c0c0c0] border-2 border-b-white border-r-white border-t-black border-l-black h-64 flex flex-col items-center justify-center p-2">
                                    {productImages.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2 w-full h-full overflow-y-auto">
                                            {productImages.map((img, i) => (
                                                <img key={i} src={img} className="border-2 border-white border-b-black border-r-black w-full h-20 object-cover" />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <Disc className="w-12 h-12 mb-2" />
                                            <p className="text-center text-sm">Insert Disk or<br />Drag Files Here</p>
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
                            </fieldset>

                            {/* FORM AREA */}
                            <fieldset className="border border-black p-4 space-y-4">
                                <legend className="px-2 font-bold">Properties</legend>

                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold">Product Name:</label>
                                    <input
                                        value={formData.nome}
                                        onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                        className="flex-1 bg-white border-2 border-t-black border-l-black border-b-white border-r-white px-2 py-1 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold">SKU ID:</label>
                                    <input
                                        value={formData.sku}
                                        onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                        className="w-32 bg-white border-2 border-t-black border-l-black border-b-white border-r-white px-2 py-1 focus:outline-none font-mono uppercase"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm font-bold">Cost Values:</label>
                                    <input
                                        type="number"
                                        value={formData.precoCusto}
                                        onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                        className="w-32 bg-white border-2 border-t-black border-l-black border-b-white border-r-white px-2 py-1 focus:outline-none font-mono"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold">Description:</label>
                                    <textarea
                                        value={formData.descricao}
                                        onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                        className="flex-1 bg-white border-2 border-t-black border-l-black border-b-white border-r-white px-2 py-1 focus:outline-none min-h-[100px] resize-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleStartMagic}
                                        disabled={isAutomationRunning}
                                        className="bg-[#c0c0c0] px-6 py-2 border-2 border-white border-b-black border-r-black active:border-l-black active:border-t-black active:border-r-white active:border-b-white active:shadow-none shadow-[2px_2px_0px_#000] font-bold active:translate-y-[2px] active:translate-x-[2px]"
                                    >
                                        {isAutomationRunning ? "Working..." : "Start"}
                                    </button>
                                </div>
                            </fieldset>
                        </div>
                    )}

                    {activeTab === 'process' && (
                        <div className="flex flex-col bg-black text-white p-4 font-mono h-full overflow-y-auto">
                            <p className="mb-4">C:\MAGIC_STUDIO\PROCESS.LOG</p>
                            {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                const status = i === 0 ? getStepStatus('Geração de Comando')
                                    : i === 1 ? getStepStatus('Copywriting')
                                        : getStepStatus('Geração de Imagens');

                                return (
                                    <div key={i} className="mb-2">
                                        <span className="mr-4 text-gray-400">{new Date().toLocaleTimeString()}</span>
                                        <span className="text-yellow-400">&lt;{agent}&gt;</span>
                                        <span className="ml-4">{status === 'running' ? 'Executing...' : status === 'completed' ? 'Done.' : 'Waiting...'}</span>
                                        {status === 'running' && <span className="animate-pulse">_</span>}
                                    </div>
                                )
                            })}
                            {isAutomationRunning && (
                                <div className="mt-8 border border-white w-64 h-6 p-1 relative">
                                    <div className="h-full bg-blue-700 w-[60%] repeating-linear-gradient-45" />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div>
                            <div className="bg-[#000080] text-white px-2 py-1 mb-4 flex justify-between">
                                <span>Gallery View</span>
                                <button className="bg-[#c0c0c0] text-black px-2 text-xs border border-white">X</button>
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

                {/* STATUS BAR */}
                <div className="bg-[#c0c0c0] border-t border-white px-2 py-1 text-xs flex gap-4 shadow-[inset_1px_1px_0px_white]">
                    <span className="border border-gray-500 border-b-white border-r-white px-2 w-32 shadow-[inset_1px_1px_0px_black]">Ready</span>
                    <span className="border border-gray-500 border-b-white border-r-white px-2 flex-1 shadow-[inset_1px_1px_0px_black]">{productId}</span>
                </div>

            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-[#c0c0c0] border-2 border-white border-b-black border-r-black shadow-none rounded-none p-1">
                    <div className="bg-[#000080] text-white px-2 py-1 mb-4 font-bold flex justify-between items-center">
                        <span>Settings</span>
                        <button onClick={() => setShowSettings(false)} className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border border-white text-xs">X</button>
                    </div>
                    <div className="p-4">
                        <N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
