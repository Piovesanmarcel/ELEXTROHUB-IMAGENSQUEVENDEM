import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ElectroHubLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

// Floating particles that rise up
const FloatingParticles = ({ count = 8 }: { count?: number }) => {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: i * 0.25,
      left: 10 + (i * 10) + Math.random() * 5,
      size: 2 + Math.random() * 2,
      duration: 2 + Math.random() * 1,
      color: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#8b5cf6' : '#f59e0b'
    })), [count]
  );

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-infinity-particle"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: `${p.left}%`,
            bottom: '10%',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}`
          }}
        />
      ))}
    </>
  );
};

// Expanding energy rings
const EnergyRings = ({ active }: { active: boolean }) => {
  const rings = [
    { delay: 0, size: 1 },
    { delay: 0.6, size: 1.2 },
    { delay: 1.2, size: 1.4 }
  ];

  return (
    <>
      {rings.map((ring, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 rounded-full border animate-infinity-ring",
            active ? "opacity-60" : "opacity-30"
          )}
          style={{
            borderColor: 'transparent',
            borderTopColor: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#8b5cf6' : '#f59e0b',
            borderRightColor: i % 3 === 1 ? '#8b5cf6' : i % 3 === 2 ? '#f59e0b' : '#06b6d4',
            animationDelay: `${ring.delay}s`,
            transform: `scale(${ring.size})`
          }}
        />
      ))}
    </>
  );
};

// Orbital dots
const OrbitalDots = () => {
  const dots = [
    { angle: 0, color: '#06b6d4', delay: 0 },
    { angle: 120, color: '#8b5cf6', delay: 0.3 },
    { angle: 240, color: '#f59e0b', delay: 0.6 }
  ];

  return (
    <div className="absolute inset-0 animate-infinity-orbit">
      {dots.map((dot, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-infinity-dot-pulse"
          style={{
            backgroundColor: dot.color,
            boxShadow: `0 0 10px ${dot.color}, 0 0 20px ${dot.color}`,
            left: '50%',
            top: '50%',
            transform: `rotate(${dot.angle}deg) translateX(50px) rotate(-${dot.angle}deg)`,
            animationDelay: `${dot.delay}s`
          }}
        />
      ))}
    </div>
  );
};

// Main Camera Symbol SVG with animated path
const CameraSymbol = ({ size, isHovered }: { size: number; isHovered: boolean }) => {
  const strokeWidth = size > 50 ? 3 : 2;
  
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute z-10"
      style={{
        width: size * 1.8,
        height: size * 1.8,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <defs>
        {/* Animated gradient */}
        <linearGradient id="camera-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4">
            <animate attributeName="stop-color" values="#06b6d4;#8b5cf6;#f59e0b;#06b6d4" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#8b5cf6">
            <animate attributeName="stop-color" values="#8b5cf6;#f59e0b;#06b6d4;#8b5cf6" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#f59e0b">
            <animate attributeName="stop-color" values="#f59e0b;#06b6d4;#8b5cf6;#f59e0b" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        
        {/* Glow filter */}
        <filter id="camera-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isHovered ? "5" : "3"} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Background glow filter */}
        <filter id="camera-bg-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" result="blur" />
        </filter>
      </defs>
      
      {/* Background glow */}
      <g filter="url(#camera-bg-glow)" opacity="0.4" className="animate-infinity-glow-pulse">
        <rect x="20" y="30" width="60" height="45" rx="8" fill="url(#camera-gradient)" />
      </g>
      
      {/* Camera body - main rectangle with rounded corners */}
      <rect
        x="20"
        y="32"
        width="60"
        height="42"
        rx="6"
        fill="none"
        stroke="url(#camera-gradient)"
        strokeWidth={strokeWidth}
        filter="url(#camera-glow)"
        className="animate-infinity-draw"
        style={{
          strokeDasharray: 220,
          strokeDashoffset: 0
        }}
      />
      
      {/* Camera top bump (flash area) */}
      <path
        d="M 35 32 L 35 26 L 50 26 L 50 32"
        fill="none"
        stroke="url(#camera-gradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#camera-glow)"
      />
      
      {/* Lens - outer circle */}
      <circle
        cx="50"
        cy="53"
        r="14"
        fill="none"
        stroke="url(#camera-gradient)"
        strokeWidth={strokeWidth}
        filter="url(#camera-glow)"
        className="animate-infinity-draw"
        style={{
          strokeDasharray: 100,
          strokeDashoffset: 0
        }}
      />
      
      {/* Lens - inner circle with pulsing */}
      <circle
        cx="50"
        cy="53"
        r="8"
        fill="url(#camera-gradient)"
        opacity="0.6"
        filter="url(#camera-glow)"
      >
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      
      {/* Flash dot */}
      <circle cx="70" cy="40" r="3" fill="#f59e0b" opacity="0.9">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
        <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite" />
      </circle>
      
      {/* Shutter button */}
      <circle cx="42" cy="26" r="2.5" fill="#06b6d4" opacity="0.8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
      </circle>
      
      {/* Lens reflection/shine */}
      <ellipse cx="45" cy="48" rx="3" ry="2" fill="white" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
};

// Mirror reflection effect
const MirrorReflection = ({ size }: { size: number }) => (
  <div 
    className="absolute w-full opacity-20 pointer-events-none"
    style={{
      height: size * 0.3,
      bottom: -size * 0.15,
      background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.3), transparent)',
      filter: 'blur(4px)',
      transform: 'scaleY(-1)'
    }}
  />
);

export function ElectroHubLogo({ 
  className = "", 
  showText = false, 
  size = "md"
}: ElectroHubLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Size configurations
  const sizeConfig = {
    sm: { container: 60, symbol: 30, text: 'text-sm' },
    md: { container: 80, symbol: 40, text: 'text-lg' },
    lg: { container: 120, symbol: 60, text: 'text-2xl' }
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center select-none w-full",
        isHovered && "animate-infinity-breathe",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main container - fully transparent */}
      <div 
        className="relative flex items-center justify-center animate-infinity-float mx-auto"
        style={{ 
          width: config.container,
          height: config.container * 0.6
        }}
      >
        {/* Floating particles background */}
        <div className="absolute inset-0 overflow-visible pointer-events-none">
          <FloatingParticles count={isHovered ? 12 : 8} />
        </div>

        {/* Energy rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <EnergyRings active={isHovered} />
        </div>

        {/* Orbital dots */}
        <OrbitalDots />

        {/* Main infinity symbol */}
        <CameraSymbol size={config.symbol} isHovered={isHovered} />

        {/* Mirror reflection */}
        <MirrorReflection size={config.container} />

        {/* Ambient glow */}
        <div 
          className="absolute inset-0 rounded-full animate-infinity-ambient"
          style={{
            background: `radial-gradient(circle at center, 
              rgba(139, 92, 246, ${isHovered ? 0.3 : 0.15}) 0%, 
              rgba(6, 182, 212, ${isHovered ? 0.2 : 0.1}) 30%, 
              transparent 70%)`,
            filter: 'blur(20px)',
            transform: 'scale(1.5)'
          }}
        />
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col ml-4">
          <span 
            className={cn(
              "font-bold bg-clip-text text-transparent animate-infinity-text-shimmer bg-[length:200%_auto]",
              config.text
            )}
            style={{
              backgroundImage: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #f59e0b, #8b5cf6, #06b6d4)'
            }}
          >
            Anúncios Que Vende
          </span>
          <span className="text-[9px] text-muted-foreground/70 -mt-0.5 tracking-wider uppercase animate-infinity-subtitle">
            Neural Infinity • IA
          </span>
        </div>
      )}
    </div>
  );
}
