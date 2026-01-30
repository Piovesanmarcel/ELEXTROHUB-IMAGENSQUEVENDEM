
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PricingInputsProps {
  profitMargin: number | '';
  taxRate: number | '';
  storeCommission: number;
  selectedPricing: string;
  onProfitMarginChange: (value: number | '') => void;
  onTaxRateChange: (value: number | '') => void;
  onStoreCommissionChange?: (value: number) => void;
}

const PricingInputs = ({
  profitMargin,
  taxRate,
  storeCommission,
  selectedPricing,
  onProfitMarginChange,
  onTaxRateChange,
  onStoreCommissionChange
}: PricingInputsProps) => {
  const getGridCols = () => {
    if (selectedPricing === 'loja-virtual') {
      return "grid-cols-1 md:grid-cols-3";
    }
    return "grid-cols-1 md:grid-cols-2";
  };

  return (
    <div className={`grid ${getGridCols()} gap-4`}>
      <div className="space-y-2">
        <Label htmlFor="profit-margin" className="font-semibold text-blue-700">
          Margem de Lucro (%)
        </Label>
        <Input
          id="profit-margin"
          type="number"
          step="0.1"
          placeholder="Ex: 30"
          value={profitMargin}
          onChange={(e) => {
            const val = e.target.value;
            onProfitMarginChange(val === '' ? '' : parseFloat(val) || 0);
          }}
          className="text-center font-semibold bg-blue-50 border-blue-200 focus:border-blue-400 focus:bg-blue-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tax-rate" className="font-semibold text-emerald-700">
          Taxa de Imposto (%)
        </Label>
        <Input
          id="tax-rate"
          type="number"
          step="0.1"
          placeholder="Ex: 4"
          value={taxRate}
          onChange={(e) => {
            const val = e.target.value;
            onTaxRateChange(val === '' ? '' : parseFloat(val) || 0);
          }}
          className="text-center font-semibold bg-emerald-50 border-emerald-200 focus:border-emerald-400 focus:bg-emerald-100"
        />
      </div>

      {selectedPricing === 'loja-virtual' && (
        <div className="space-y-2">
          <Label htmlFor="store-commission" className="font-semibold text-purple-700">
            Comissão da Loja (%)
          </Label>
          <Input
            id="store-commission"
            type="number"
            step="0.1"
            placeholder="5"
            value={storeCommission}
            onChange={(e) => onStoreCommissionChange?.(parseFloat(e.target.value) || 5)}
            className="text-center font-semibold bg-purple-50 border-purple-200 focus:border-purple-400 focus:bg-purple-100"
          />
        </div>
      )}
    </div>
  );
};

export default PricingInputs;
