import { useEnhancementUsage } from '@/hooks/useEnhancementUsage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Coins, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserCreditsIndicatorProps {
  compact?: boolean;
}

export function UserCreditsIndicator({ compact = false }: UserCreditsIndicatorProps) {
  const { usage, isLoading } = useEnhancementUsage();
  const navigate = useNavigate();

  const available = usage?.enhancements_available ?? 0;
  const isLow = available > 0 && available <= 5;
  const isEmpty = available === 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {!compact && <span className="text-sm">Carregando...</span>}
      </div>
    );
  }

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${isEmpty ? 'text-destructive' : isLow ? 'text-yellow-500' : ''}`}
            onClick={() => navigate('/comprar-creditos')}
          >
            {isEmpty ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Coins className="h-4 w-4" />
            )}
            <span className="font-medium">{available}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{available} créditos disponíveis</p>
          {isEmpty && <p className="text-destructive">Compre mais créditos</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Coins className={`h-5 w-5 ${isEmpty ? 'text-destructive' : isLow ? 'text-yellow-500' : 'text-primary'}`} />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {available} créditos
          </span>
          <span className="text-xs text-muted-foreground">
            {usage?.enhancements_used ?? 0} utilizados
          </span>
        </div>
      </div>
      
      {isEmpty && (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Sem créditos
        </Badge>
      )}
      
      {isLow && !isEmpty && (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          Poucos créditos
        </Badge>
      )}
      
      {(isEmpty || isLow) && (
        <Button
          size="sm"
          variant={isEmpty ? 'default' : 'outline'}
          onClick={() => navigate('/comprar-creditos')}
        >
          Comprar
        </Button>
      )}
    </div>
  );
}
