
import { Badge } from "@/components/ui/badge";
import { Cloud, HardDrive, AlertCircle, CheckCircle } from "lucide-react";

interface HostingStatusIndicatorProps {
  isHosted: boolean;
  hostingService?: string;
  hostingMessage?: string;
}

export const HostingStatusIndicator = ({ 
  isHosted, 
  hostingService, 
  hostingMessage 
}: HostingStatusIndicatorProps) => {
  // Cloudflare (Principal)
  if (isHosted && hostingService === 'cloudflare') {
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
        <CheckCircle className="h-3 w-3 mr-1" />
        Hospedada no Cloudflare (Principal)
      </Badge>
    );
  }

  // ImgBB (Secundário)
  if (isHosted && hostingService === 'imgbb') {
    return (
      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
        <Cloud className="h-3 w-3 mr-1" />
        Hospedada no ImgBB (Secundário)
      </Badge>
    );
  }

  // DeepAI (Fallback)
  if (!isHosted && hostingService === 'deepai_direct') {
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
        <HardDrive className="h-3 w-3 mr-1" />
        DeepAI Direto (Fallback)
      </Badge>
    );
  }

  // Outros serviços hospedados
  if (isHosted && hostingService) {
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
        <Cloud className="h-3 w-3 mr-1" />
        Hospedada ({hostingService?.toUpperCase()})
      </Badge>
    );
  }

  // Erro de hospedagem
  return (
    <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
      <AlertCircle className="h-3 w-3 mr-1" />
      Erro de Hospedagem
    </Badge>
  );
};
