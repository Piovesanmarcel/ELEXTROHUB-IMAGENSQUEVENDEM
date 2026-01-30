import { useEffect, useState, useRef } from 'react';
import { TrendingUp, Plug, Shield, Clock, Zap, Heart } from 'lucide-react';

const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const useCountUp = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (!isVisible) return;
      
      let startTime: number;
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setCount(Math.floor(end * progress));
        if (progress < 1) requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    }, [isVisible, end, duration]);
    
    return count;
  };

  const adsCount = useCountUp(10000);
  const integrationsCount = useCountUp(8);
  const uptimeCount = useCountUp(99);

  const mainStats = [
    {
      icon: TrendingUp,
      value: adsCount,
      suffix: '+',
      label: 'Anúncios criados',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderColor: 'border-emerald-200 dark:border-emerald-500/20'
    },
    {
      icon: Plug,
      value: integrationsCount,
      suffix: '+',
      label: 'Integrações',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'border-blue-200 dark:border-blue-500/20'
    },
    {
      icon: Shield,
      value: uptimeCount,
      suffix: '.2%',
      label: 'Uptime',
      color: 'text-violet-500',
      bgColor: 'bg-violet-50 dark:bg-violet-500/10',
      borderColor: 'border-violet-200 dark:border-violet-500/20'
    }
  ];

  const secondaryStats = [
    { icon: Clock, value: '24/7', label: 'Suporte' },
    { icon: Zap, value: '< 30s', label: 'Processamento' },
    { icon: Heart, value: '98%', label: 'Satisfação' }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="py-10 md:py-14 bg-gradient-to-b from-muted/40 via-muted/20 to-background"
    >
      <div className="container mx-auto px-4">
        {/* Header compacto */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-display">
            Números que Comprovam
          </h2>
          <p className="text-muted-foreground text-sm">
            Resultados reais de vendedores como você
          </p>
        </div>

        {/* Cards principais animados */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto mb-6">
          {mainStats.map((stat, index) => (
            <div 
              key={index}
              className={`
                group relative p-4 md:p-6 rounded-xl border transition-all duration-500
                ${stat.bgColor} ${stat.borderColor}
                hover:scale-[1.02] hover:shadow-lg
                ${isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
                }
              `}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color} mb-2 md:mb-3`} />
              <div className={`text-2xl md:text-4xl font-bold ${stat.color} font-display`}>
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Stats secundárias inline */}
        <div 
          className={`
            flex flex-wrap justify-center items-center gap-4 md:gap-8
            transition-all duration-700 delay-300
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          {secondaryStats.map((stat, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 text-muted-foreground"
            >
              <stat.icon className="w-4 h-4 text-primary/60" />
              <span className="font-semibold text-foreground">{stat.value}</span>
              <span className="text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
