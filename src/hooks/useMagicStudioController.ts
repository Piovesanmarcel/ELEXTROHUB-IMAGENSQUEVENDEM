
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWebhookStorage } from "@/features/generator/hooks/useWebhookStorage";
import { useAdGeneratorAutomation } from "@/hooks/useAdGeneratorAutomation";
import { useBroadcast } from "@/contexts/BroadcastContext";

export function useMagicStudioController() {
    // ===== STATES =====
    const [productImages, setProductImages] = useState<string[]>([]);
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState("input");

    // N8N Webhooks
    const { webhooks, saveWebhook } = useWebhookStorage();

    // Internal States
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        sku: '',
        precoCusto: '',
        peso: ''
    });

    // Helper to init product ID
    const [productId, setProductId] = useState(() => {
        const existing = sessionStorage.getItem('unified_ad_gen_v2_id');
        return existing || `forge-${Date.now()}`;
    });

    // Automation Hook
    const automation = useAdGeneratorAutomation(productImages, formData as any, setProductImages, productId);
    const { startAutomation, isAutomationRunning, steps, unifiedCommandsData, copywritingData, geminiImages } = automation;


    // ===== EFFECT: Restore Images =====
    useEffect(() => {
        sessionStorage.setItem('unified_ad_gen_v2_id', productId);
    }, [productId]);

    // ===== HANDLERS =====
    const handleImagesUploaded = (newImages: string[]) => {
        setProductImages(prev => [...prev, ...newImages]);
        if (referenceImages.length < 2) {
            setReferenceImages(prev => [...prev, ...newImages].slice(0, 2));
        }
    };

    const handleStartMagic = () => {
        // Validação Rigorosa
        if (productImages.length === 0) {
            toast.error("Adicione obrigatoriamente pelo menos uma imagem!");
            return;
        }
        if (!formData.nome) {
            toast.error("O Nome do Produto é obrigatório!");
            return;
        }
        if (!formData.sku) {
            toast.error("O SKU é obrigatório!");
            return;
        }
        if (!formData.precoCusto) {
            toast.error("O Preço de Custo é obrigatório!");
            return;
        }
        if (!formData.peso) {
            toast.error("O Peso (g) é obrigatório!");
            return;
        }

        setActiveTab("process");
        startAutomation();
    };

    const handleNewProject = () => {
        if (window.confirm("Isso limpará todo o projeto atual. Deseja continuar?")) {
            // 1. Limpar estados locais
            setProductImages([]);
            setReferenceImages([]);
            setFormData({
                nome: '',
                descricao: '',
                sku: '',
                precoCusto: '',
                peso: ''
            });

            // 2. Gerar novo ID
            const newId = `forge-${Date.now()}`;
            setProductId(newId);
            sessionStorage.setItem('unified_ad_gen_v2_id', newId);

            // 3. Limpar storages
            sessionStorage.removeItem('unified_ad_generator_product_images');
            sessionStorage.removeItem('unified_ad_generator_reference_images');

            // 4. Resetar aba
            setActiveTab("input");

            // 5. Notificar
            toast.success("Novo projeto iniciado! Quadro limpo.");
        }
    };

    const getStepStatus = (stepName: string) => {
        const step = steps.find(s => s.label === stepName);
        return step?.status || 'idle';
    };

    return {
        state: {
            productImages, setProductImages,
            referenceImages, setReferenceImages,
            showSettings, setShowSettings,
            activeTab, setActiveTab,
            formData, setFormData,
            productId, setProductId,
            webhooks,
            isAutomationRunning,
            automationStep: automation.automationStep,
            steps,
            unifiedCommandsData,
            copywritingData,
            geminiImages,
            kitImages: automation.kitImages
        },
        actions: {
            setProductImages,
            setReferenceImages,
            setShowSettings,
            setActiveTab,
            setFormData,
            saveWebhook,
            handleImagesUploaded,
            handleStartMagic,
            handleNewProject,
            getStepStatus
        }
    };
}
