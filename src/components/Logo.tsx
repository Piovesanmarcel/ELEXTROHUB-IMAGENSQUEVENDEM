
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size]} gradient-primary rounded-xl flex items-center justify-center shadow-lg`}>
        <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-white" fill="currentColor">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" />
          <path d="M2 17L12 22L22 17" />
          <path d="M2 12L12 17L22 12" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold gradient-text`}>
            BlingHub
          </span>
          <span className="text-xs text-muted-foreground -mt-1">
            E-commerce Platform
          </span>
        </div>
      )}
    </div>
  );
}
