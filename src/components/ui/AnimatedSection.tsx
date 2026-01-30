import React from 'react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale';
  delay?: number;
  className?: string;
  threshold?: number;
}

export const AnimatedSection = ({ 
  children, 
  animation = 'fade-up',
  delay = 0,
  className,
  threshold = 0.1
}: AnimatedSectionProps) => {
  const { ref, isVisible } = useScrollAnimation(threshold);
  
  const baseStyles = 'transition-all duration-700 ease-out';
  
  const hiddenStyles = {
    'fade-up': 'translate-y-8 opacity-0',
    'fade-in': 'opacity-0',
    'slide-left': '-translate-x-8 opacity-0',
    'slide-right': 'translate-x-8 opacity-0',
    'scale': 'scale-95 opacity-0'
  };

  const visibleStyles = 'translate-y-0 translate-x-0 scale-100 opacity-100';

  return (
    <div
      ref={ref}
      className={cn(
        baseStyles,
        isVisible ? visibleStyles : hiddenStyles[animation],
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
