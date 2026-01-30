
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionControlsProps {
  isSyncing: boolean;
  showSyncOptions: boolean;
  onSyncClick: () => void;
  onNormalSync: () => void;
  onForceSync: () => void;
  onForceAllSync: () => void;
}

export function ActionControls({
  isSyncing,
  showSyncOptions,
  onSyncClick,
  onNormalSync,
  onForceSync,
  onForceAllSync,
}: ActionControlsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          disabled={isSyncing}
          className="flex items-center gap-2"
          variant="default"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onClick={onNormalSync} className="flex flex-col items-start p-3">
          <div className="font-medium">Sincronização Normal</div>
          <div className="text-sm text-muted-foreground">
            Continua de onde parou ou detecta novos produtos automaticamente
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onForceSync} className="flex flex-col items-start p-3">
          <div className="font-medium">Re-sincronizar Meus Produtos</div>
          <div className="text-sm text-muted-foreground">
            Força nova sincronização completa dos seus produtos
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onForceAllSync} className="flex flex-col items-start p-3">
          <div className="font-medium">Re-sincronizar Todos os Usuários</div>
          <div className="text-sm text-muted-foreground">
            Força nova sincronização completa para todos os usuários (admin)
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
