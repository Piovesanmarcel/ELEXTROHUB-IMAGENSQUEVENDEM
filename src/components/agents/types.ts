/**
 * ============================================
 * TIPOS - Agentes IA ElectroHub
 * ============================================
 * Tipos TypeScript para os 3 agentes de conversão
 */

/**
 * Identificador do agente
 */
export type AgentType = 'atlas' | 'lyra' | 'orion';

/**
 * Estado atual do agente
 */
export type AgentStatus = 'idle' | 'running' | 'success' | 'error';

/**
 * Tamanhos disponíveis para o avatar
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Configuração de um agente
 */
export interface AgentConfig {
  /** Tipo do agente */
  type: AgentType;
  /** Nome do agente */
  name: string;
  /** Emoji/ícone do agente */
  icon: string;
  /** Descrição curta */
  description: string;
  /** Cor primária (CSS custom property) */
  primaryColor: string;
  /** Cor secundária (CSS custom property) */
  secondaryColor: string;
  /** Cor do brilho/glow */
  glowColor: string;
  /** Classe CSS de animação de pulsação */
  pulseAnimation: string;
}

/**
 * Mensagens contextuais do agente
 */
export interface AgentMessages {
  idle: string;
  running: string[];
  success: string;
  error: string;
}

/**
 * Propriedades do componente AgentAvatar
 */
export interface AgentAvatarProps {
  /** Tipo do agente (atlas, lyra ou orion) */
  agent: AgentType;
  /** Status atual do agente */
  status: AgentStatus;
  /** Tamanho do avatar (default: 'sm') */
  size?: AvatarSize;
  /** Mostrar nome do agente? (default: false) */
  showName?: boolean;
  /** Mostrar barra de progresso? (default: false) */
  showProgress?: boolean;
  /** Progresso atual (0-100) */
  progress?: number;
  /** Mensagem de status customizada */
  statusMessage?: string;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Mapa de configurações dos agentes
 */
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  atlas: {
    type: 'atlas',
    name: 'ATLAS',
    icon: '🧠',
    description: 'O Estrategista',
    primaryColor: 'hsl(200, 100%, 60%)',
    secondaryColor: 'hsl(200, 90%, 50%)',
    glowColor: 'rgba(51, 181, 255, 0.4)',
    pulseAnimation: 'animate-agent-pulse-blue',
  },
  lyra: {
    type: 'lyra',
    name: 'LYRA',
    icon: '✍️',
    description: 'A Persuasora',
    primaryColor: 'hsl(280, 100%, 60%)',
    secondaryColor: 'hsl(280, 90%, 50%)',
    glowColor: 'rgba(153, 51, 255, 0.4)',
    pulseAnimation: 'animate-agent-pulse-violet',
  },
  orion: {
    type: 'orion',
    name: 'ORION',
    icon: '📸',
    description: 'O Artista Visual',
    primaryColor: 'hsl(25, 100%, 60%)',
    secondaryColor: 'hsl(25, 90%, 50%)',
    glowColor: 'rgba(255, 148, 77, 0.4)',
    pulseAnimation: 'animate-agent-pulse-coral',
  },
};

/**
 * Mensagens padrão para cada agente
 */
export const AGENT_MESSAGES: Record<AgentType, AgentMessages> = {
  atlas: {
    idle: 'Aguardando início da análise...',
    running: [
      'Identificando características-chave...',
      'Analisando categoria e público-alvo...',
      'Traçando estratégia de marketing...',
      'Definindo posicionamento de mercado...',
    ],
    success: 'Análise estratégica completa!',
    error: 'Erro na análise. Verifique os dados do produto.',
  },
  lyra: {
    idle: 'Aguardando análise do ATLAS...',
    running: [
      'Criando títulos persuasivos...',
      'Gerando descrições otimizadas...',
      'Desenvolvendo FAQs estratégicas...',
      'Aplicando técnicas de copywriting...',
    ],
    success: 'Textos profissionais gerados!',
    error: 'Erro ao gerar copywriting. Tente novamente.',
  },
  orion: {
    idle: 'Aguardando textos da LYRA...',
    running: [
      'Gerando cena de estúdio...',
      'Criando mockup profissional...',
      'Renderizando ambiente lifestyle...',
      'Aplicando upscale 4K...',
    ],
    success: 'Imagens profissionais geradas!',
    error: 'Erro ao gerar imagens. Verifique créditos.',
  },
};
