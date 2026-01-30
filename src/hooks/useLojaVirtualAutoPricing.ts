
import { useMemo } from 'react';
import { calculateLojaVirtualPricing } from '@/utils/lojaVirtualPricingCalculations';

interface UseLojaVirtualAutoPricingProps {
  costPrice: number;
  profitMargin: number;
  taxRate: number;
  storeCommission: number;
  fixedFreight?: number;
}

export const useLojaVirtualAutoPricing = ({
  costPrice,
  profitMargin,
  taxRate,
  storeCommission,
  fixedFreight = 28
}: UseLojaVirtualAutoPricingProps) => {
  const results = useMemo(() => {
    if (!costPrice || costPrice <= 0) {
      return null;
    }

    const inputs = {
      costPrice: costPrice.toString(),
      commission: storeCommission.toString(),
      freight: fixedFreight.toString(),
      profitMargin: profitMargin.toString(),
      taxRate: taxRate.toString()
    };

    return calculateLojaVirtualPricing(inputs);
  }, [costPrice, profitMargin, taxRate, storeCommission, fixedFreight]);

  return results;
};
