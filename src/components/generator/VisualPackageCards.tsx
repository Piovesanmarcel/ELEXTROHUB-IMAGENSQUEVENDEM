/**
 * ============================================
 * VISUAL PACKAGE CARDS - Pacotes de Geração Visual
 * ============================================
 * Cards interativos para selecionar pacotes de geração de imagens
 * com avatares animados e integração com webhooks n8n
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Zap,
  Crown,
  Rocket,
  CheckCircle2,
  Loader2,
  Image,
  Star,
  TrendingUp,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  TechHeroAvatar,
  GamerGirlAvatar,
  FoxMascotAvatar,
  FairyTechAvatar
} from './GameAvatars';

// ============================================
// TIPOS E CONFIGURAÇÕES
// ============================================

export type PackageType = 'start' | 'pro' | 'expert' | 'brand';
export type PackageStatus = 'idle' | 'running' | 'success' | 'error';

export interface VisualPackage {
  id: PackageType;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  glowColor: string;
  bgGradient: string;
  borderColor: string;
  icon: React.ElementType;
  AvatarComponent: React.ComponentType<{ size?: number; animate?: boolean; className?: string }>;
  popular?: boolean;
  images: {
    fundoBranco: number;
    ambientada: number;
    emUso: number;
    comPessoas: number;
    magicas: number;
  };
  totalImages: number;
  includes: string[];
}

export const VISUAL_PACKAGES: VisualPackage[] = [
  {
    id: 'start',
    name: 'Visual Start com Atlas',
    subtitle: 'Ideal para criar 1 anúncio profissional completo',
    description: '5 imagens profissionais',
    color: 'text-green-500',
    glowColor: 'hsl(142, 76%, 36%)',
    bgGradient: 'from-green-500/10 to-green-500/5',
    borderColor: 'border-green-500/50 hover:border-green-500/70',
    icon: Sparkles,
    AvatarComponent: TechHeroAvatar,
    images: {
      fundoBranco: 1,
      ambientada: 1,
      emUso: 0,
      comPessoas: 0,
      magicas: 3
    },
    totalImages: 5,
    includes: ['Conteúdo Estratégico', 'SEO & Descoberta', 'Estratégia Comercial']
  },
  {
    id: 'pro',
    name: 'Visual Pro com Lyra',
    subtitle: 'Ideal para um anúncio mais forte e competitivo',
    description: '6 imagens profissionais',
    color: 'text-blue-500',
    glowColor: 'hsl(200, 100%, 50%)',
    bgGradient: 'from-blue-500/10 to-blue-500/5',
    borderColor: 'border-blue-500/50 hover:border-blue-500/70',
    icon: Zap,
    AvatarComponent: GamerGirlAvatar,
    images: {
      fundoBranco: 1,
      ambientada: 1,
      emUso: 0,
      comPessoas: 0,
      magicas: 4
    },
    totalImages: 6,
    includes: ['Conteúdo Estratégico', 'SEO & Descoberta', 'Estratégia Comercial']
  },
  {
    id: 'expert',
    name: 'Visual Expert Scale com Orion',
    subtitle: 'Ideal para criar variações e escalar anúncios',
    description: '9 imagens profissionais',
    color: 'text-violet-500',
    glowColor: 'hsl(280, 100%, 50%)',
    bgGradient: 'from-violet-500/10 to-violet-500/5',
    borderColor: 'border-violet-500/50 hover:border-violet-500/70',
    icon: Crown,
    AvatarComponent: FoxMascotAvatar,
    popular: true,
    images: {
      fundoBranco: 1,
      ambientada: 1,
      emUso: 1,
      comPessoas: 0,
      magicas: 6
    },
    totalImages: 8,
    includes: ['Conteúdo Estratégico', 'SEO & Descoberta', 'Estratégia Comercial']
  },
  {
    id: 'brand',
    name: 'Visual Brand Pro Expert com Lucy',
    subtitle: 'Ideal para escalar, criar Variação e dominar o visual e construir marca',
    description: '12 imagens profissionais',
    color: 'text-orange-500',
    glowColor: 'hsl(25, 100%, 50%)',
    bgGradient: 'from-orange-500/10 to-orange-500/5',
    borderColor: 'border-orange-500/50 hover:border-orange-500/70',
    icon: Rocket,
    AvatarComponent: FairyTechAvatar,
    images: {
      fundoBranco: 1,
      ambientada: 1,
      emUso: 1,
      comPessoas: 1,
      magicas: 8
    },
    totalImages: 12,
    includes: ['Conteúdo Estratégico', 'SEO & Descoberta', 'Estratégia Comercial']
  }
];

// ============================================
// COMPONENTE AVATAR ANIMADO
// ============================================

interface PackageAvatarProps {
  pkg: VisualPackage;
  status: PackageStatus;
  size?: 'sm' | 'md' | 'lg';
}

const PackageAvatar = ({ pkg, status, size = 'md' }: PackageAvatarProps) => {
  const sizeMap = {
    sm: 72, // 2.0x of 36
    md: 84, // 2.0x of 42
    lg: 112 // 2.0x of 56
  };

  const AvatarComponent = pkg.AvatarComponent;

  return (
    <div className="relative">
      <div
        className={cn(
          'rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden',
          status === 'running' && 'ring-4 ring-offset-2 scale-105',
          status === 'success' && 'ring-4 ring-green-500/50 ring-offset-2',
          status === 'error' && 'ring-4 ring-red-500/50 ring-offset-2'
        )}
        style={{
          background: `linear-gradient(135deg, ${pkg.glowColor}15, ${pkg.glowColor}30)`,
          boxShadow: status === 'running'
            ? `0 0 35px ${pkg.glowColor}70, 0 0 0 4px ${pkg.glowColor}40`
            : `0 0 20px ${pkg.glowColor}40`
        }}
      >
        <AvatarComponent
          size={sizeMap[size]}
          animate={status === 'running'}
          className={cn(
            'transition-all duration-300',
            status === 'running' && 'scale-105',
            status === 'idle' && 'hover:scale-105'
          )}
        />
      </div>

      {/* Status Badge */}
      {status === 'running' && (
        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 shadow-lg">
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        </div>
      )}
      {status === 'success' && (
        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 shadow-lg">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1.5 shadow-lg">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE CARD DE PACOTE
// ============================================

interface VisualPackageCardProps {
  pkg: VisualPackage;
  status: PackageStatus;
  progress: number;
  onSelect: (packageId: PackageType) => void;
  disabled?: boolean;
  statusMessage?: string;
}

const VisualPackageCard = ({
  pkg,
  status,
  progress,
  onSelect,
  disabled,
  statusMessage
}: VisualPackageCardProps) => {
  const totalImages = pkg.images.fundoBranco + pkg.images.ambientada +
    pkg.images.emUso + pkg.images.comPessoas + pkg.images.magicas;

  return (
    <Card
      className={cn(
        'relative flex flex-col h-full transition-all duration-300 border-2 overflow-hidden cursor-pointer',
        'hover:scale-[1.02] hover:-translate-y-1',
        pkg.borderColor,
        status === 'running' && 'ring-2 ring-offset-2',
        status === 'success' && 'border-green-500/70',
        status === 'error' && 'border-red-500/70',
        pkg.popular && 'scale-[1.01]'
      )}
      style={{
        boxShadow: status === 'running'
          ? `0 0 25px -10px ${pkg.glowColor}, 0 0 0 2px ${pkg.glowColor}50`
          : `0 0 25px -10px ${pkg.glowColor}`
      }}
      onClick={() => !disabled && status !== 'running' && onSelect(pkg.id)}
    >
      {/* Background Gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-b opacity-50', pkg.bgGradient)} />

      {/* Popular Badge */}
      {pkg.popular && (
        <div className="absolute -top-0 right-3 z-10">
          <Badge className="bg-violet-500 text-white px-4 py-1.5 text-sm font-bold shadow-lg animate-pulse">
            <Star className="w-4 h-4 mr-2" />
            Popular
          </Badge>
        </div>
      )}

      <CardContent className="relative z-10 p-5 flex flex-col h-full">
        {/* Header com Avatar */}
        <div className="flex items-start gap-4 mb-4">
          <PackageAvatar pkg={pkg} status={status} size="md" />

          <div className="flex-1 min-w-0">
            <h3 className={cn('font-bold text-xl leading-tight', pkg.color)}>
              {pkg.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {pkg.subtitle}
            </p>
          </div>
        </div>

        {/* Contagem de Imagens */}
        <div className="bg-secondary/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-medium flex items-center gap-1">
              <Image className="w-4 h-4" />
              Inclui {totalImages} imagens:
            </span>
          </div>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            {pkg.images.fundoBranco > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>{pkg.images.fundoBranco} fundo branco {pkg.id === 'brand' && 'premium'}</span>
              </div>
            )}
            {pkg.images.ambientada > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>{pkg.images.ambientada} ambientada {pkg.id === 'pro' && 'premium'}</span>
              </div>
            )}
            {pkg.images.emUso > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>{pkg.images.emUso} produto em uso</span>
              </div>
            )}
            {pkg.images.comPessoas > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>{pkg.images.comPessoas} com pessoas</span>
              </div>
            )}
            {pkg.images.magicas > 0 && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-violet-500" />
                <span className="font-medium">{pkg.images.magicas} imagens MÁGICAS com SUA logo</span>
              </div>
            )}
          </div>
        </div>

        {/* Vai Junto */}
        <div className="mb-4 flex-1">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Vai junto:</p>
          <div className="space-y-1">
            {pkg.includes.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar (quando running) */}
        {status === 'running' && (
          <div className="mb-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center mt-1">
              {statusMessage || `Gerando ${Math.round(progress)}%...`}
            </p>
          </div>
        )}

        {/* Botão de Ação */}
        {/* Indicador de Status (Substituindo o botão por indicação visual) */}
        <div
          className={cn(
            'w-full mt-auto font-semibold transition-all h-auto min-h-[48px] py-2 px-3 rounded-md shadow-sm flex items-center justify-center text-center leading-tight text-white border-0',
            status === 'success' ? 'bg-green-500' :
              status === 'error' ? 'bg-red-500' :
                status === 'running' ? 'bg-blue-500' : 'bg-muted/30 text-muted-foreground'
          )}
          style={{
            backgroundColor: status === 'idle' ? `${pkg.glowColor}20` : undefined,
            color: status === 'idle' ? pkg.glowColor : undefined,
            border: status === 'idle' ? `1px solid ${pkg.glowColor}40` : undefined
          }}
        >
          {status === 'running' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Concluído!
            </>
          ) : (
            <>
              <pkg.icon className="w-4 h-4 mr-2 opacity-50" />
              Selecionar {pkg.name.split(' ')[1]} {/* Exibe apenas 'Start', 'Pro', etc */}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// COMPONENTE PRINCIPAL - GRID DE PACOTES
// ============================================

interface VisualPackageCardsProps {
  onGeneratePackage: (packageId: PackageType, config: VisualPackage) => Promise<void>;
  disabled?: boolean;
  className?: string;
  onSelect?: (packageId: PackageType) => void;
  selectedPackageId?: PackageType | null;
}

export const VisualPackageCards = ({
  onGeneratePackage,
  disabled,
  className,
  onSelect,
  selectedPackageId
}: VisualPackageCardsProps) => {
  const [statuses, setStatuses] = useState<Record<PackageType, PackageStatus>>({
    start: 'idle',
    pro: 'idle',
    expert: 'idle',
    brand: 'idle'
  });

  const [progress, setProgress] = useState<Record<PackageType, number>>({
    start: 0,
    pro: 0,
    expert: 0,
    brand: 0
  });

  const [statusMessages, setStatusMessages] = useState<Record<PackageType, string>>({
    start: '',
    pro: '',
    expert: '',
    brand: ''
  });

  const handleSelect = async (packageId: PackageType) => {
    // Se tiver onSelect, apenas seleciona e não inicia geração
    if (onSelect) {
      onSelect(packageId);
      return;
    }

    const pkg = VISUAL_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return;

    // Atualizar status para running
    setStatuses(prev => ({ ...prev, [packageId]: 'running' }));
    setProgress(prev => ({ ...prev, [packageId]: 0 }));

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          [packageId]: Math.min(prev[packageId] + Math.random() * 15, 95)
        }));
      }, 500);

      await onGeneratePackage(packageId, pkg);

      clearInterval(progressInterval);
      setProgress(prev => ({ ...prev, [packageId]: 100 }));
      setStatuses(prev => ({ ...prev, [packageId]: 'success' }));

      toast.success(`Solicitação enviada: ${pkg.name}`, {
        description: `Aguarde! As ${pkg.images.fundoBranco + pkg.images.ambientada + pkg.images.emUso + pkg.images.comPessoas + pkg.images.magicas} imagens aparecerão na galeria em breve.`
      });

      // Reset após 5 segundos
      setTimeout(() => {
        setStatuses(prev => ({ ...prev, [packageId]: 'idle' }));
        setProgress(prev => ({ ...prev, [packageId]: 0 }));
      }, 5000);

    } catch (error) {
      setStatuses(prev => ({ ...prev, [packageId]: 'error' }));
      toast.error(`Erro ao gerar ${pkg.name}`, {
        description: error instanceof Error ? error.message : 'Tente novamente'
      });

      // Reset após 3 segundos
      setTimeout(() => {
        setStatuses(prev => ({ ...prev, [packageId]: 'idle' }));
        setProgress(prev => ({ ...prev, [packageId]: 0 }));
      }, 3000);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <Badge className="bg-gradient-to-r from-violet-500 to-orange-500 text-white px-4 py-1.5 mb-3">
          <Sparkles className="w-4 h-4 mr-2" />
          Crie Imagens Incríveis
        </Badge>
        <h3 className="text-xl font-bold">A nova geração de design</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Clareza estratégica + linguagem de conversão para seu anúncio
        </p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {VISUAL_PACKAGES.map((pkg) => (
          <VisualPackageCard
            key={pkg.id}
            pkg={pkg}
            status={statuses[pkg.id]}
            progress={progress[pkg.id]}
            statusMessage={statusMessages[pkg.id]}
            onSelect={handleSelect}
            disabled={disabled || Object.values(statuses).some(s => s === 'running')}
          />
        ))}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Upscale automático em todas</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          <span>SEO otimizado</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          <span>Alta conversão</span>
        </div>
      </div>
    </div>
  );
};


export default VisualPackageCards;
