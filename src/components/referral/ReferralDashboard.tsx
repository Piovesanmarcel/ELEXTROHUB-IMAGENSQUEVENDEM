
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useReferralSystem } from "@/hooks/useReferralSystem";
import { Gift, Users, Copy, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const ReferralDashboard = () => {
  const { 
    referralCodes, 
    referrals, 
    isLoading, 
    generateReferralCode, 
    deactivateReferralCode 
  } = useReferralSystem();
  
  const [referralCodeInput, setReferralCodeInput] = useState("");

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Código copiado!");
    } catch (error) {
      toast.error("Erro ao copiar código");
    }
  };

  const getReferralUrl = (code: string) => {
    return `${window.location.origin}/?ref=${code}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'Pendente', variant: 'secondary' as const },
      'completed': { label: 'Convertido', variant: 'default' as const },
      'credited': { label: 'Creditado', variant: 'default' as const }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalCreditsEarned = referrals
    .filter(r => r.status === 'credited')
    .reduce((total, r) => total + r.credits_awarded, 0);

  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
  const completedReferrals = referrals.filter(r => r.status === 'credited').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sistema de Indicações</h2>
          <p className="text-muted-foreground">
            Indique amigos e ganhe 500 créditos para cada pessoa que assinar um plano
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Créditos Ganhos</p>
                <p className="text-2xl font-bold text-green-600">{totalCreditsEarned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Indicações Ativas</p>
                <p className="text-2xl font-bold text-blue-600">{pendingReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold text-purple-600">{completedReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Codes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seus Códigos de Indicação</CardTitle>
              <CardDescription>
                Gere códigos únicos para compartilhar com seus amigos
              </CardDescription>
            </div>
            <Button 
              onClick={generateReferralCode} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Gerar Código
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {referralCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum código de indicação encontrado. Gere seu primeiro código!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referralCodes.map((code) => (
                <div 
                  key={code.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg">{code.code}</span>
                      <Badge variant={code.is_active ? "default" : "secondary"}>
                        {code.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Usado {code.uses_count} de {code.max_uses} vezes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Link: {getReferralUrl(code.code)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(code.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getReferralUrl(code.code))}
                    >
                      Link
                    </Button>
                    {code.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateReferralCode(code.id)}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referrals History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Indicações</CardTitle>
          <CardDescription>
            Acompanhe o status das suas indicações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma indicação encontrada ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div 
                  key={referral.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Código: {referral.referral_code}</span>
                      {getStatusBadge(referral.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Indicado em: {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    {referral.conversion_date && (
                      <p className="text-sm text-muted-foreground">
                        Convertido em: {new Date(referral.conversion_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {referral.credits_awarded > 0 && (
                      <div className="text-green-600 font-semibold">
                        +{referral.credits_awarded} créditos
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
