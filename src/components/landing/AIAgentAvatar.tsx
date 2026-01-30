import { cn } from '@/lib/utils';

interface AIAgentAvatarProps {
  agent: 'atlas' | 'lyra' | 'orion';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const AIAgentAvatar = ({ agent, size = 'md', animated = true, className }: AIAgentAvatarProps) => {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  };

  const sizeValues = {
    sm: 80,
    md: 128,
    lg: 160
  };

  const svgSize = sizeValues[size];
  const center = svgSize / 2;

  // ATLAS - The Strategist (Blue/Cyan)
  if (agent === 'atlas') {
    return (
      <div className={cn(sizeClasses[size], 'relative', className)}>
        <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full h-full">
          <defs>
            <radialGradient id="atlas-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(200, 100%, 60%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(200, 100%, 40%)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="atlas-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(200, 100%, 50%)" />
              <stop offset="100%" stopColor="hsl(220, 100%, 60%)" />
            </linearGradient>
          </defs>
          
          {/* Glow effect */}
          <circle cx={center} cy={center} r={center * 0.9} fill="url(#atlas-glow)" className={animated ? 'animate-agent-pulse-blue' : ''} />
          
          {/* Orbits */}
          <g className={animated ? 'animate-orbit-slow' : ''} style={{ transformOrigin: 'center' }}>
            <ellipse cx={center} cy={center} rx={center * 0.7} ry={center * 0.25} 
              fill="none" stroke="hsl(200, 100%, 60%)" strokeWidth="1" opacity="0.5" 
              transform={`rotate(-20 ${center} ${center})`} />
            <circle cx={center + center * 0.65} cy={center - center * 0.15} r="4" fill="hsl(200, 100%, 70%)" className={animated ? 'animate-pulse' : ''} />
          </g>
          
          <g className={animated ? 'animate-orbit-medium' : ''} style={{ transformOrigin: 'center' }}>
            <ellipse cx={center} cy={center} rx={center * 0.55} ry={center * 0.2} 
              fill="none" stroke="hsl(210, 100%, 60%)" strokeWidth="1" opacity="0.4" 
              transform={`rotate(30 ${center} ${center})`} />
            <circle cx={center - center * 0.5} cy={center + center * 0.1} r="3" fill="hsl(210, 100%, 70%)" className={animated ? 'animate-pulse' : ''} />
          </g>
          
          <g className={animated ? 'animate-orbit-fast' : ''} style={{ transformOrigin: 'center' }}>
            <ellipse cx={center} cy={center} rx={center * 0.4} ry={center * 0.15} 
              fill="none" stroke="hsl(220, 100%, 60%)" strokeWidth="1" opacity="0.3" 
              transform={`rotate(-45 ${center} ${center})`} />
            <circle cx={center + center * 0.35} cy={center + center * 0.1} r="2" fill="hsl(220, 100%, 70%)" className={animated ? 'animate-pulse' : ''} />
          </g>
          
          {/* Central brain icon */}
          <g transform={`translate(${center - 16}, ${center - 16})`}>
            <path d="M16 4c-2 0-3.5 1-4.5 2.5C10.5 5 9 4 7 4 3.5 4 1 7 1 10.5c0 4 3.5 7.5 8 11.5l7 6 7-6c4.5-4 8-7.5 8-11.5C31 7 28.5 4 25 4c-2 0-3.5 1-4.5 2.5C19.5 5 18 4 16 4z" 
              fill="none" stroke="url(#atlas-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
            <path d="M12 8a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4h-1l-1-2h-4l-1 2h-1z" 
              fill="none" stroke="url(#atlas-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 14h4M18 14h4M12 18c1 1 2.5 2 4 2s3-1 4-2" 
              fill="none" stroke="url(#atlas-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
        
        {/* Outer glow ring */}
        <div className={cn(
          "absolute inset-0 rounded-full",
          animated && "animate-agent-glow-blue"
        )} />
      </div>
    );
  }

  // LYRA - The Persuader (Violet/Magenta)
  if (agent === 'lyra') {
    return (
      <div className={cn(sizeClasses[size], 'relative', className)}>
        <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full h-full">
          <defs>
            <radialGradient id="lyra-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(280, 100%, 60%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(280, 100%, 40%)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="lyra-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(280, 100%, 60%)" />
              <stop offset="100%" stopColor="hsl(320, 100%, 60%)" />
            </linearGradient>
          </defs>
          
          {/* Glow effect */}
          <circle cx={center} cy={center} r={center * 0.9} fill="url(#lyra-glow)" className={animated ? 'animate-agent-pulse-violet' : ''} />
          
          {/* Sound/Text waves */}
          {[0.5, 0.65, 0.8].map((scale, i) => (
            <circle 
              key={i}
              cx={center} 
              cy={center} 
              r={center * scale} 
              fill="none" 
              stroke="hsl(280, 100%, 60%)" 
              strokeWidth="1" 
              opacity={0.3 - i * 0.08}
              className={animated ? 'animate-wave-pulse' : ''}
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
          
          {/* Sparkles */}
          {animated && (
            <>
              <circle cx={center * 0.4} cy={center * 0.5} r="2" fill="hsl(320, 100%, 70%)" className="animate-sparkle" style={{ animationDelay: '0s' }} />
              <circle cx={center * 1.6} cy={center * 0.6} r="2.5" fill="hsl(280, 100%, 70%)" className="animate-sparkle" style={{ animationDelay: '0.5s' }} />
              <circle cx={center * 1.5} cy={center * 1.4} r="2" fill="hsl(300, 100%, 70%)" className="animate-sparkle" style={{ animationDelay: '1s' }} />
              <circle cx={center * 0.5} cy={center * 1.5} r="1.5" fill="hsl(280, 100%, 70%)" className="animate-sparkle" style={{ animationDelay: '1.5s' }} />
            </>
          )}
          
          {/* Central pen icon */}
          <g transform={`translate(${center - 14}, ${center - 14})`}>
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" 
              fill="none" stroke="url(#lyra-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m15 5 4 4" 
              fill="none" stroke="url(#lyra-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
        
        {/* Outer glow ring */}
        <div className={cn(
          "absolute inset-0 rounded-full",
          animated && "animate-agent-glow-violet"
        )} />
      </div>
    );
  }

  // ORION - The Visual Artist (Coral/Amber)
  if (agent === 'orion') {
    return (
      <div className={cn(sizeClasses[size], 'relative', className)}>
        <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full h-full">
          <defs>
            <radialGradient id="orion-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(25, 100%, 60%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(25, 100%, 40%)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="orion-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(25, 100%, 55%)" />
              <stop offset="100%" stopColor="hsl(45, 100%, 50%)" />
            </linearGradient>
          </defs>
          
          {/* Glow effect */}
          <circle cx={center} cy={center} r={center * 0.9} fill="url(#orion-glow)" className={animated ? 'animate-agent-pulse-coral' : ''} />
          
          {/* Constellation stars */}
          <g className={animated ? 'animate-twinkle-group' : ''}>
            {/* Orion belt stars */}
            <circle cx={center * 0.7} cy={center * 0.85} r="3" fill="hsl(45, 100%, 70%)" />
            <circle cx={center} cy={center * 0.8} r="3.5" fill="hsl(45, 100%, 75%)" />
            <circle cx={center * 1.3} cy={center * 0.85} r="3" fill="hsl(45, 100%, 70%)" />
            
            {/* Connecting lines */}
            <line x1={center * 0.7} y1={center * 0.85} x2={center} y2={center * 0.8} stroke="hsl(45, 100%, 60%)" strokeWidth="1" opacity="0.4" />
            <line x1={center} y1={center * 0.8} x2={center * 1.3} y2={center * 0.85} stroke="hsl(45, 100%, 60%)" strokeWidth="1" opacity="0.4" />
            
            {/* Shoulder stars */}
            <circle cx={center * 0.5} cy={center * 0.5} r="2.5" fill="hsl(25, 100%, 70%)" className={animated ? 'animate-twinkle' : ''} style={{ animationDelay: '0.2s' }} />
            <circle cx={center * 1.5} cy={center * 0.5} r="2.5" fill="hsl(25, 100%, 70%)" className={animated ? 'animate-twinkle' : ''} style={{ animationDelay: '0.7s' }} />
            
            {/* Foot stars */}
            <circle cx={center * 0.6} cy={center * 1.4} r="2" fill="hsl(35, 100%, 65%)" className={animated ? 'animate-twinkle' : ''} style={{ animationDelay: '0.4s' }} />
            <circle cx={center * 1.4} cy={center * 1.4} r="2" fill="hsl(35, 100%, 65%)" className={animated ? 'animate-twinkle' : ''} style={{ animationDelay: '0.9s' }} />
          </g>
          
          {/* Floating pixels */}
          {animated && (
            <>
              <rect x={center * 0.3} y={center * 1.1} width="4" height="4" fill="hsl(25, 100%, 60%)" className="animate-float-pixel" style={{ animationDelay: '0s' }} />
              <rect x={center * 1.6} y={center * 1.0} width="3" height="3" fill="hsl(45, 100%, 60%)" className="animate-float-pixel" style={{ animationDelay: '0.5s' }} />
              <rect x={center * 1.1} y={center * 1.5} width="3" height="3" fill="hsl(35, 100%, 60%)" className="animate-float-pixel" style={{ animationDelay: '1s' }} />
            </>
          )}
          
          {/* Central camera icon */}
          <g transform={`translate(${center - 14}, ${center - 10})`}>
            <path d="M23 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" 
              fill="none" stroke="url(#orion-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="13" cy="13" r="4" 
              fill="none" stroke="url(#orion-gradient)" strokeWidth="2" />
          </g>
        </svg>
        
        {/* Outer glow ring */}
        <div className={cn(
          "absolute inset-0 rounded-full",
          animated && "animate-agent-glow-coral"
        )} />
      </div>
    );
  }

  return null;
};

export default AIAgentAvatar;
