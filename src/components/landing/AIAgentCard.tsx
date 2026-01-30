import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AIAgentAvatar from './AIAgentAvatar';
import { cn } from '@/lib/utils';

interface AIAgentCardProps {
  name: string;
  role: string;
  description: string;
  quote: string;
  abilities: string[];
  agent: 'atlas' | 'lyra' | 'orion';
  badge: string;
  className?: string;
}

const AIAgentCard = ({ 
  name, 
  role, 
  description, 
  quote, 
  abilities, 
  agent, 
  badge,
  className 
}: AIAgentCardProps) => {
  const colorClasses = {
    atlas: {
      border: 'border-blue-500/50 hover:border-blue-500/70',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      glow: 'shadow-[0_0_30px_-12px_hsl(200,100%,50%)] group-hover:shadow-[0_0_40px_-10px_hsl(200,100%,50%)]',
      name: 'text-blue-400',
      ability: 'bg-blue-500/10 text-blue-300 border-blue-500/20'
    },
    lyra: {
      border: 'border-violet-500/50 hover:border-violet-500/70',
      badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      glow: 'shadow-[0_0_30px_-12px_hsl(280,100%,50%)] group-hover:shadow-[0_0_40px_-10px_hsl(280,100%,50%)]',
      name: 'text-violet-400',
      ability: 'bg-violet-500/10 text-violet-300 border-violet-500/20'
    },
    orion: {
      border: 'border-primary/50 hover:border-primary/70',
      badge: 'bg-primary/10 text-primary border-primary/20',
      glow: 'shadow-[0_0_30px_-12px_hsl(25,100%,50%)] group-hover:shadow-[0_0_40px_-10px_hsl(25,100%,50%)]',
      name: 'text-primary',
      ability: 'bg-primary/10 text-primary/80 border-primary/20'
    }
  };

  const colors = colorClasses[agent];

  return (
    <Card className={cn(
      'group card-hover border-2 border-border bg-card/80 backdrop-blur-sm transition-all duration-500',
      colors.border,
      colors.glow,
      className
    )}>
      <CardContent className="p-8 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-6 transition-transform duration-500 group-hover:scale-110">
          <AIAgentAvatar agent={agent} size="md" animated />
        </div>
        
        {/* Badge */}
        <Badge className={cn('mb-4', colors.badge)}>
          {badge}
        </Badge>
        
        {/* Name & Role */}
        <h3 className={cn('text-2xl font-bold font-display mb-1', colors.name)}>
          {name}
        </h3>
        <p className="text-muted-foreground font-medium mb-4">{role}</p>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {description}
        </p>
        
        {/* Quote */}
        <blockquote className="italic text-foreground/80 text-sm mb-6 px-4 py-3 rounded-xl bg-secondary/50 border-l-2 border-current">
          "{quote}"
        </blockquote>
        
        {/* Abilities */}
        <div className="flex flex-wrap justify-center gap-2">
          {abilities.map((ability, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className={cn('text-xs', colors.ability)}
            >
              {ability}
            </Badge>
          ))}
        </div>

        {/* Link to agent page */}
        <Link 
          to={`/agente/${agent}`}
          className={cn(
            "mt-6 flex items-center justify-center gap-2 text-sm font-medium transition-all",
            "text-muted-foreground hover:text-foreground group-hover:translate-x-1"
          )}
        >
          Conhecer {name}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
};

export default AIAgentCard;
