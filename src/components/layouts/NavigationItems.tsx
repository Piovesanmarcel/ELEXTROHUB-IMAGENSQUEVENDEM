
import {
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Calculator,
  Store,
  Home,
  Truck,
  Rocket,
  FileSpreadsheet,
  ImageIcon,
  Sparkles,
  Gift,
  TestTube,
  Group,
  Wand2,
  Brain,
  Layout,
  DollarSign,
  ShieldCheck,
  CreditCard,
  Activity,
  FileText,
  Beaker,
  Info
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | null;
  submenu?: Array<{ name: string; href: string }>;
}

export const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/painel",
    icon: Home,
    badge: null
  },
  {
    name: "Landing Page Oficial",
    href: "/saas-landing",
    icon: Rocket,
    badge: null
  },
  {
    name: "Sobre",
    href: "/sobre",
    icon: Info,
    badge: null
  },
  // { 
  //   name: "Galeria de Marketing", 
  //   href: "/galeria-marketing", 
  //   icon: ImageIcon,
  //   badge: "NOVO" 
  // },

  // { 
  //   name: "🧪 Teste n8n", 
  //   href: "/gerador-anuncios-n8n", 
  //   icon: TestTube,
  //   badge: "DEV" 
  // },
  // { 
  //   name: "📝 Copywriting N8N", 
  //   href: "/copywriting-profissional-n8n", 
  //   icon: FileSpreadsheet,
  //   badge: "DEV" 
  // },
  // { 
  //   name: "⚡ Comando Unificado", 
  //   href: "/comando-unificado-n8n", 
  //   icon: Sparkles,
  //   badge: "DEV" 
  // },
  // { 
  //   name: "🚀 Gerador Completo", 
  //   href: "/gerador-completo-n8n", 
  //   icon: Sparkles,
  //   badge: "NOVO" 
  // },

  {
    name: "Gerador Teste 02",
    href: "/gerador-teste-02",
    icon: Beaker,
    badge: null
  },
  {
    name: "Gerador Completo N8N",
    href: "/gerador-unificado-test",
    icon: TestTube,
    badge: null
  },
  {
    name: "Gerador Unificado (Copy)",
    href: "/gerador-unificado-copy",
    icon: Wand2,
    badge: null
  },
  {
    name: "Gerador Unificado 02",
    href: "/gerador-unificado-copy02",
    icon: Wand2,
    badge: null
  },

  // { 
  //   name: "🎨 Templates n8n", 
  //   href: "/canva-n8n", 
  //   icon: Layout,
  //   badge: "NOVO" 
  // },
  // { 
  //   name: "Produtos", 
  //   href: "/produtos", 
  //   icon: Package,
  //   badge: null 
  // },
  // { 
  //   name: "Agrupamento de Produtos", 
  //   href: "/agrupamento-produtos", 
  //   icon: Group,
  //   badge: "NOVO" 
  // },
  // { 
  //   name: "Pedidos", 
  //   href: "/pedidos", 
  //   icon: ShoppingCart,
  //   badge: null 
  // },
  // { 
  //   name: "Indicações", 
  //   href: "/indicacoes", 
  //   icon: Gift,
  //   badge: "NOVO" 
  // },
  // { 
  //   name: "Gerador de Logos", 
  //   href: "/gerador-logos", 
  //   icon: Sparkles,
  //   badge: "NOVO" 
  // },
  // { 
  //   name: "FluxAI Generator", 
  //   href: "/fluxai-generator", 
  //   icon: Wand2,
  //   badge: "NOVO" 
  // },
  // { 
  //   name: "BFL.ai Generator", 
  //   href: "/bfl-generator", 
  //   icon: Sparkles,
  //   badge: "NOVO" 
  // },
  // { 
  //   name: "Tongyi Wanxiang", 
  //   href: "/tongyi-wanxiang", 
  //   icon: Brain,
  //   badge: "NOVO" 
  // },
  // { 
  //   name: "Gemini Background Generator", 
  //   href: "/gemini-background", 
  //   icon: Wand2,
  //   badge: "NOVO" 
  // },
  {
    name: "Cloudinary Transform",
    href: "/cloudinary-transform",
    icon: ImageIcon,
    badge: null
  },
  {
    name: "Editor de Templates",
    href: "/auto-template-mapper",
    icon: Layout,
    badge: null
  },
  // { 
  //   name: "Runware Test", 
  //   href: "/runware-test", 
  //   icon: TestTube,
  //   badge: "NOVO" 
  // },
  {
    name: "Gerador EAN",
    href: "/ean-generator",
    icon: FileSpreadsheet,
    badge: null
  },
  {
    name: "Melhoria de Imagens",
    href: "/melhoria-imagens",
    icon: ImageIcon,
    badge: null
  },
  {
    name: "Relatório Webhooks",
    href: "/relatorio-webhooks",
    icon: Activity,
    badge: null
  },
  {
    name: "Precificação",
    href: "/precificacao",
    icon: Calculator,
    submenu: [
      { name: "Shopee", href: "/precificacao" },
      { name: "Shein", href: "/precificacao/shein" },
      { name: "Kwai", href: "/precificacao/kwai" },
      { name: "Amazon", href: "/precificacao/amazon" },
      { name: "MercadoLivre", href: "/precificacao/mercadolivre" },
      { name: "Magalu", href: "/precificacao/magalu" },
      { name: "TikTok Shop", href: "/precificacao/tiktok" },
      { name: "Loja Virtual", href: "/precificacao/loja-virtual" }
    ]
  },
  // { 
  //   name: "Relatórios", 
  //   href: "/relatorios", 
  //   icon: BarChart3,
  //   badge: null 
  // },
  // { 
  //   name: "Custos de IA", 
  //   href: "/custos-ia", 
  //   icon: DollarSign,
  //   badge: "NOVO" 
  // },
  // { 
  //   name: "Marketplaces", 
  //   href: "/marketplaces", 
  //   icon: Store,
  //   badge: null 
  // },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    badge: null
  }
];

// Admin navigation items - only visible to admins
export const adminNavigationItems: NavigationItem[] = [
  {
    name: "Status do Sistema",
    href: "/system-status",
    icon: ShieldCheck,
    badge: "ADMIN"
  },
  {
    name: "Monitor de Jobs",
    href: "/admin/queue-monitor",
    icon: Activity,
    badge: "ADMIN"
  },
  {
    name: "Galeria Homepage",
    href: "/admin/gallery",
    icon: ImageIcon,
    badge: "ADMIN"
  },
  {
    name: "Histórico de Compras",
    href: "/admin/compras",
    icon: CreditCard,
    badge: "ADMIN"
  },
  {
    name: "Roteiros de Marketing",
    href: "/marketing-content",
    icon: FileText,
    badge: "ADMIN"
  }
];

export interface AdminNavigationSection {
  title: string;
  icon: any;
  items: NavigationItem[];
}

export const adminSection: AdminNavigationSection = {
  title: "Administração",
  icon: ShieldCheck,
  items: adminNavigationItems
};
