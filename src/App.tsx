import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import DashboardLayout from "./components/layouts/DashboardLayout";
import LoadingScreen from "@/components/ui/loading-screen";
import { EnhancedImagesProvider } from "@/contexts/EnhancedImagesContext";
import { PromptSyncProvider } from "@/contexts/PromptSyncContext";
import { BroadcastProvider } from "@/contexts/BroadcastContext";
import { UserJobStatusProvider } from "@/contexts/UserJobStatusContext";
import { GlobalCrashOverlay } from "@/components/GlobalCrashOverlay";
import { ActiveJobIndicator } from "@/components/queue/ActiveJobIndicator";
import "@/events/WhiteBackgroundBridge"; // 🌉 Bridge global para white-background images
import "@/events/GlobalEventLogger"; // 🔍 Logger global de eventos IA
import "@/events/TemplateIdTracker"; // 📊 Tracker de templateIds
import "@/events/N8NDebugInterface"; // 🔧 Interface unificada de debug n8n
import UnifiedAdGeneratorTest02 from "./pages/UnifiedAdGeneratorTest02";

// Lazy load all pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const MarketingImageGeneratorPage = lazy(() => import("./pages/MarketingImageGenerator"));
const LogoGenerator = lazy(() => import("./pages/LogoGenerator"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SheinPricing = lazy(() => import("./pages/SheinPricing"));
const KwaiPricing = lazy(() => import("./pages/KwaiPricing"));
const AmazonPricing = lazy(() => import("./pages/AmazonPricing"));
const MercadoLivrePricing = lazy(() => import("./pages/MercadoLivrePricing"));
const MagaluPricing = lazy(() => import("./pages/MagaluPricing"));
const TiktokPricing = lazy(() => import("./pages/TiktokPricing"));
const LojaVirtualPricing = lazy(() => import("./pages/LojaVirtualPricing"));
const EanGenerator = lazy(() => import("./pages/EanGenerator"));
const BulkImageEnhancement = lazy(() => import("./pages/BulkImageEnhancement"));
const ComprarCreditos = lazy(() => import("./pages/ComprarCreditos"));
const PagamentoSucesso = lazy(() => import("./pages/PagamentoSucesso"));
const PagamentoCancelado = lazy(() => import("./pages/PagamentoCancelado"));
const Planos = lazy(() => import("./pages/Planos"));
const AssinaturaSucesso = lazy(() => import("./pages/AssinaturaSucesso"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const CloudflareTest = lazy(() => import("./pages/CloudflareTest"));
const FotographerTest = lazy(() => import("./pages/FotographerTest"));
const FreepikTest = lazy(() => import("./pages/FreepikTest"));
const RunwareTest = lazy(() => import("./pages/RunwareTest"));
const ProductGrouping = lazy(() => import("./pages/ProductGrouping"));
const ChatGPTAssistantTest = lazy(() => import("./pages/ChatGPTAssistantTest"));
const FluxAIGenerator = lazy(() => import("./pages/FluxAIGenerator"));
const BflGenerator = lazy(() => import("./pages/BflGenerator"));
const BflTestPage = lazy(() => import("./components/BflTestPage"));
const TongyiWanxiang = lazy(() => import("./pages/TongyiWanxiang"));
const GeminiBackgroundGenerator = lazy(() => import("./pages/GeminiBackgroundGenerator"));
const CloudinaryTransform = lazy(() => import("./pages/CloudinaryTransform"));
const TemplateMapper = lazy(() => import("./pages/TemplateMapperPage"));
const AutoTemplateMapper = lazy(() => import("./pages/AutoTemplateMapperPage"));
const QueueMonitor = lazy(() => import("./pages/QueueMonitor"));
const MarketingGallery = lazy(() => import("./pages/MarketingGallery"));
const AdsConfigurator = lazy(() => import("./pages/AdsConfigurator"));

const AdGeneratorN8N = lazy(() => import("./pages/AdGeneratorN8N"));
const ComandoUnificadoN8N = lazy(() => import("./pages/ComandoUnificadoN8N"));
const CopywritingProfissionalN8N = lazy(() => import("./pages/CopywritingProfissionalN8N"));
const GeradorCompletoN8N = lazy(() => import("./pages/GeradorCompletoN8N"));
const CanvaTemplateN8N = lazy(() => import("./pages/CanvaTemplateN8NPage"));

const UnifiedAdGeneratorCopy = lazy(() => import("./pages/UnifiedAdGeneratorCopy"));
const UnifiedAdGeneratorCopy02 = lazy(() => import("./pages/UnifiedAdGeneratorCopy02"));
const UnifiedAdGeneratorTest = lazy(() => import("./pages/UnifiedAdGeneratorTest"));
const SaaSLandingPage = lazy(() => import("./pages/SaaSLandingPage"));


const AICosts = lazy(() => import("./pages/AICosts"));
const AdminCompras = lazy(() => import("./pages/admin/AdminCompras"));
const AdminMetrics = lazy(() => import("./pages/AdminMetrics"));
const QueueTestPage = lazy(() => import("./pages/admin/QueueTestPage"));
const ImportTemplates = lazy(() => import("./pages/admin/ImportTemplates"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const MigrationGuide = lazy(() => import("./pages/MigrationGuide"));
const AdminQueueMonitor = lazy(() => import("./pages/AdminQueueMonitor"));
const N8NStreamDebug = lazy(() => import("./pages/N8NStreamDebug"));
const GalleryManager = lazy(() => import("./pages/admin/GalleryManager"));
const MarketingContent = lazy(() => import("./pages/MarketingContent"));
const SubscriptionLanding = lazy(() => import("./pages/SubscriptionLanding"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

// Agent pages
const AgentAtlas = lazy(() => import("./pages/AgentAtlas"));
const AgentLyra = lazy(() => import("./pages/AgentLyra"));
const AgentOrion = lazy(() => import("./pages/AgentOrion"));
const WebhookReport = lazy(() => import("./pages/WebhookReport"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserJobStatusProvider>
        <BroadcastProvider>
          <PromptSyncProvider>
            <EnhancedImagesProvider>
              <TooltipProvider>
                <Toaster />
                <GlobalCrashOverlay />
                <ActiveJobIndicator />
                <BrowserRouter>
                  <Suspense fallback={<LoadingScreen message="Carregando página..." />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/bfl-test" element={<BflTestPage />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/system-status" element={<SystemStatus />} />
                      <Route path="/migration-guide" element={<MigrationGuide />} />
                      <Route path="/marketing-content" element={<MarketingContent />} />
                      <Route path="/assinatura" element={<SubscriptionLanding />} />
                      <Route path="/sobre" element={<LandingPage />} />

                      {/* Agent pages - public */}
                      <Route path="/agente/atlas" element={<AgentAtlas />} />
                      <Route path="/agente/lyra" element={<AgentLyra />} />
                      <Route path="/agente/orion" element={<AgentOrion />} />

                      <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                        <Route path="painel" element={<Dashboard />} />
                        <Route path="produtos" element={<Products />} />
                        <Route path="produtos/:id" element={<ProductDetails />} />
                        <Route path="produtos/:id/marketing" element={<MarketingImageGeneratorPage />} />
                        <Route path="relatorios" element={<Reports />} />
                        <Route path="relatorio-webhooks" element={<WebhookReport />} />
                        <Route path="configuracoes" element={<Settings />} />
                        <Route path="precificacao" element={<Pricing />} />
                        <Route path="precificacao/shein" element={<SheinPricing />} />
                        <Route path="precificacao/kwai" element={<KwaiPricing />} />
                        <Route path="precificacao/amazon" element={<AmazonPricing />} />
                        <Route path="precificacao/mercadolivre" element={<MercadoLivrePricing />} />
                        <Route path="precificacao/magalu" element={<MagaluPricing />} />
                        <Route path="precificacao/tiktok" element={<TiktokPricing />} />
                        <Route path="precificacao/loja-virtual" element={<LojaVirtualPricing />} />
                        <Route path="ean-generator" element={<EanGenerator />} />
                        <Route path="melhoria-imagens" element={<BulkImageEnhancement />} />
                        <Route path="comprar-creditos" element={<ComprarCreditos />} />
                        <Route path="pagamento-sucesso" element={<PagamentoSucesso />} />
                        <Route path="pagamento-cancelado" element={<PagamentoCancelado />} />
                        <Route path="planos" element={<Planos />} />
                        <Route path="assinatura-sucesso" element={<AssinaturaSucesso />} />
                        <Route path="indicacoes" element={<ReferralProgram />} />
                        <Route path="fotographer-test" element={<FotographerTest />} />
                        <Route path="freepik-test" element={<FreepikTest />} />
                        <Route path="runware-test" element={<RunwareTest />} />
                        <Route path="agrupamento-produtos" element={<ProductGrouping />} />
                        <Route path="chatgpt-assistant-test" element={<ChatGPTAssistantTest />} />
                        <Route path="fluxai-generator" element={<FluxAIGenerator />} />
                        <Route path="bfl-generator" element={<BflGenerator />} />
                        <Route path="bfl-test" element={<BflTestPage />} />
                        <Route path="tongyi-wanxiang" element={<TongyiWanxiang />} />
                        <Route path="gemini-background" element={<GeminiBackgroundGenerator />} />
                        <Route path="cloudinary-transform" element={<CloudinaryTransform />} />
                        <Route path="template-mapper" element={<TemplateMapper />} />
                        <Route path="auto-template-mapper" element={<AutoTemplateMapper />} />
                        <Route path="monitoramento-fila" element={<QueueMonitor />} />
                        <Route path="galeria-marketing" element={<MarketingGallery />} />
                        <Route path="ads-configurator" element={<AdsConfigurator />} />

                        <Route path="gerador-anuncios-n8n" element={<AdGeneratorN8N />} />
                        <Route path="comando-unificado-n8n" element={<ComandoUnificadoN8N />} />
                        <Route path="copywriting-profissional-n8n" element={<CopywritingProfissionalN8N />} />
                        <Route path="gerador-completo-n8n" element={<GeradorCompletoN8N />} />
                        <Route path="canva-n8n" element={<CanvaTemplateN8N />} />

                        <Route path="gerador-unificado-copy" element={<UnifiedAdGeneratorCopy02 />} />
                        <Route path="gerador-unificado-copy02" element={<UnifiedAdGeneratorCopy02 />} />
                        <Route path="gerador-unificado-test" element={<UnifiedAdGeneratorTest />} />
                        <Route path="saas-landing" element={<SaaSLandingPage />} />
                        <Route path="gerador-teste-02" element={<UnifiedAdGeneratorTest02 />} />


                        <Route path="debug/n8n-stream" element={<N8NStreamDebug />} />
                        <Route path="custos-ia" element={<AICosts />} />

                        {/* Admin Routes */}
                        <Route path="admin/compras" element={<RequireAdmin><AdminCompras /></RequireAdmin>} />
                        <Route path="admin/metrics" element={<RequireAdmin><AdminMetrics /></RequireAdmin>} />
                        <Route path="admin/queue-test" element={<RequireAdmin><QueueTestPage /></RequireAdmin>} />
                        <Route path="admin/import-templates" element={<RequireAdmin><ImportTemplates /></RequireAdmin>} />
                        <Route path="admin/queue-monitor" element={<RequireAdmin><AdminQueueMonitor /></RequireAdmin>} />
                        <Route path="admin/gallery" element={<RequireAdmin><GalleryManager /></RequireAdmin>} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </EnhancedImagesProvider>
          </PromptSyncProvider>
        </BroadcastProvider>
      </UserJobStatusProvider>
    </QueryClientProvider>
  );
}

export default App;
