
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReferralSystem } from "@/hooks/useReferralSystem";
import { Gift } from "lucide-react";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReferralModal = ({ isOpen, onClose, onSuccess }: ReferralModalProps) => {
  const [referralCode, setReferralCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerReferral } = useReferralSystem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCode.trim()) return;

    setIsSubmitting(true);
    const success = await registerReferral(referralCode.trim().toUpperCase());
    
    if (success) {
      setReferralCode("");
      onClose();
      onSuccess?.();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setReferralCode("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            <DialogTitle>Código de Indicação</DialogTitle>
          </div>
          <DialogDescription>
            Foi indicado por alguém? Digite o código de indicação para que ambos ganhem créditos!
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referralCode">Código de Indicação</Label>
            <Input
              id="referralCode"
              placeholder="Digite o código aqui..."
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="uppercase font-mono"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Pular
            </Button>
            <Button 
              type="submit" 
              disabled={!referralCode.trim() || isSubmitting}
            >
              {isSubmitting ? "Verificando..." : "Aplicar Código"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
