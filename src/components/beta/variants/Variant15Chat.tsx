
import {
    Sparkles, Settings, Zap,
    Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon,
    Brain, FileText, Wand2, RefreshCw,
    Package, Search, ArrowRight, Grid, Send, User, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { useMagicStudioController } from "@/hooks/useMagicStudioController";
import { useState, useRef, useEffect } from "react";

interface VariantProps {
    state: ReturnType<typeof useMagicStudioController>['state'];
    actions: ReturnType<typeof useMagicStudioController>['actions'];
}

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: React.ReactNode;
    timestamp: Date;
}

export function Variant15Chat({ state, actions }: VariantProps) {
    const {
        productImages, showSettings, activeTab, formData,
        productId, webhooks, isAutomationRunning,
    } = state;

    const {
        setProductImages, setShowSettings, setActiveTab,
        setFormData, saveWebhook, handleImagesUploaded, handleStartMagic,
        handleNewProject, getStepStatus
    } = actions;

    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: "Hello! I'm your Magic Studio AI assistant. Ready to create some ads? Start by uploading your product images or telling me about your product.", timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Sync Messages with App State
    useEffect(() => {
        if (productImages.length > 0 && messages.filter(m => m.id === 'upload-confirm').length === 0) {
            setMessages(prev => [...prev, {
                id: 'upload-confirm',
                role: 'assistant',
                content: (
                    <div>
                        <p>Great! I received {productImages.length} images. Here they are:</p>
                        <div className="flex gap-2 mt-2 overflow-x-auto">
                            {productImages.map((img, i) => (
                                <img key={i} src={img} className="w-16 h-16 rounded object-cover" />
                            ))}
                        </div>
                        <p className="mt-2 text-sm text-slate-500">If you want to delete any, just ask or use the gallery view later.</p>
                    </div>
                ),
                timestamp: new Date()
            }]);
        }
    }, [productImages]);

    // Handle Send
    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMsg]);

        // Simple parsing logic for "chat" simulation
        const text = inputText.toLowerCase();
        setInputText("");

        // Simulate AI thinking
        setTimeout(() => {
            let aiResponse: React.ReactNode = "";

            if (text.includes("name") || text.includes("call it") || text.includes("product is")) {
                setFormData(p => ({ ...p, nome: text.replace("my product is", "").replace("call it", "").trim() }));
                aiResponse = "Got it. Updating product name.";
            } else if (text.includes("sku")) {
                setFormData(p => ({ ...p, sku: text.replace("sku", "").trim() }));
                aiResponse = "SKU updated.";
            } else if (text.includes("generate") || text.includes("start") || text.includes("go")) {
                if (productImages.length === 0) {
                    aiResponse = "I need some images first! Please upload them.";
                } else if (!formData.nome || !formData.precoCusto) {
                    aiResponse = (
                        <div>
                            <p>I still need a bit more info before we start.</p>
                            <div className="bg-slate-50 p-4 rounded mt-2 text-sm border border-slate-200">
                                <Input
                                    placeholder="Product Name"
                                    value={formData.nome}
                                    onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                    className="mb-2 bg-white"
                                />
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="SKU"
                                        value={formData.sku}
                                        onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                                        className="bg-white"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Cost"
                                        value={formData.precoCusto}
                                        onChange={(e) => setFormData(p => ({ ...p, precoCusto: e.target.value }))}
                                        className="bg-white"
                                    />
                                </div>
                                <Textarea
                                    placeholder="Description"
                                    value={formData.descricao}
                                    onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                                    className="bg-white mb-2 h-20"
                                />
                                <Button size="sm" onClick={() => handleStartMagic()}>Confirm & Start</Button>
                            </div>
                        </div>
                    );
                } else {
                    handleStartMagic();
                    aiResponse = "Starting the magic engine now! 🚀";
                }
            } else {
                aiResponse = "I'm focusing on your ad campaign. You can update details like Name, SKU, or Description here, or say 'Start' to generate.";
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString() + 'ai',
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            }]);

        }, 800);
    };

    return (
        <div className="h-screen bg-slate-50 font-sans flex flex-col max-w-5xl mx-auto shadow-2xl overflow-hidden md:border-x border-slate-200">

            {/* CHAT HEADER */}
            <header className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800">Magic Assistant</h1>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${isAutomationRunning ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                            <span className="text-xs text-slate-500">{isAutomationRunning ? 'Working on your ads...' : 'Online & Ready'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => setShowSettings(true)}><Settings className="w-5 h-5" /></Button>
                    <Button size="icon" variant="ghost" onClick={handleNewProject}><RefreshCw className="w-5 h-5" /></Button>
                </div>
            </header>

            {/* MESSAGES AREA */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[#f8fafc]" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'assistant' ? 'bg-gradient-to-tr from-blue-500 to-purple-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                            {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'assistant' ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                            <div className="text-sm leading-relaxed">{msg.content}</div>
                            <div className={`text-[10px] mt-2 opacity-50 text-right`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

                {/* DYNAMIC STATUS BUBBLE (If running) */}
                {isAutomationRunning && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="max-w-[80%] bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 w-full md:w-[400px]">
                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Live Progress</h3>
                            <div className="space-y-3">
                                {['ATLAS', 'LYRA', 'ORION'].map((agent, i) => {
                                    const status = i === 0 ? getStepStatus('Geração de Comando')
                                        : i === 1 ? getStepStatus('Copywriting')
                                            : getStepStatus('Geração de Imagens');
                                    return (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 font-medium">{agent}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${status === 'running' ? 'bg-blue-100 text-blue-600 animate-pulse' : status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{status}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {productImages.length > 0 && messages.length > 2 && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="max-w-full bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 w-full animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="font-bold mb-4">Gallery Preview</h3>
                            <ProductImagesGrid
                                images={productImages}
                                productName={formData.nome}
                                productId={productId}
                                onDelete={(index) => {
                                    setProductImages(prev => prev.filter((_, i) => i !== index));
                                }}
                            />
                        </div>
                    </div>
                )}
            </main>

            {/* INPUT AREA */}
            <footer className="bg-white p-4 border-t border-slate-200">
                <div className="flex gap-2 items-end max-w-4xl mx-auto">
                    <div className="relative">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                            <Upload className="w-5 h-5" />
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
                    <div className="flex-1 bg-slate-100 rounded-xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <Textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Describe your product manually, or modify settings..."
                            className="bg-transparent border-none shadow-none focus-visible:ring-0 min-h-[24px] max-h-[120px] resize-none p-0 text-slate-800 placeholder:text-slate-400 w-full"
                        />
                    </div>
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20" onClick={handleSend}>
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400">Magic Studio AI can make mistakes. Review generated assets.</p>
                </div>
            </footer>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent><N8NWebhooksUI webhooks={webhooks} onSave={saveWebhook} variant="compact" /></DialogContent>
            </Dialog>
        </div>
    );
}
