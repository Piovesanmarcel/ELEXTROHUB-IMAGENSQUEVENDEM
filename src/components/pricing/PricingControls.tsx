
import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import PricingSelector from "./PricingSelector";
import PricingInputs from "./PricingInputs";

interface PricingControlsProps {
  profitMargin: number | '';
  taxRate: number | '';
  onProfitMarginChange: (value: number | '') => void;
  onTaxRateChange: (value: number | '') => void;
  selectedPricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual' | 'mercadolivre' | 'magalu';
  onPricingChange: (pricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual' | 'mercadolivre' | 'magalu') => void;
  storeCommission?: number;
  onStoreCommissionChange?: (value: number) => void;
}

const PricingControls = memo(function PricingControls({
  profitMargin,
  taxRate,
  onProfitMarginChange,
  onTaxRateChange,
  selectedPricing,
  onPricingChange,
  storeCommission = 5,
  onStoreCommissionChange
}: PricingControlsProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <Card className="glass-effect">
      <CardHeader className="cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Configurações de Precificação</CardTitle>
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-4">
          <PricingSelector
            selectedPricing={selectedPricing}
            onPricingChange={onPricingChange}
          />

          <PricingInputs
            profitMargin={profitMargin}
            taxRate={taxRate}
            storeCommission={storeCommission}
            selectedPricing={selectedPricing}
            onProfitMarginChange={onProfitMarginChange}
            onTaxRateChange={onTaxRateChange}
            onStoreCommissionChange={onStoreCommissionChange}
          />

          {/* Informação sobre frete fixo para Loja Virtual */}
          {selectedPricing === 'loja-virtual' && (
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">
                💡 Frete fixo de R$ 28,00 será aplicado automaticamente nos cálculos
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
});

export default PricingControls;
