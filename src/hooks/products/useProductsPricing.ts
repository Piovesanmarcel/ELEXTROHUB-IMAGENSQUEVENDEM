
import { useState } from "react";

export function useProductsPricing() {
  const [profitMargin, setProfitMargin] = useState<number | ''>('');
  const [taxRate, setTaxRate] = useState<number | ''>('');
  const [storeCommission, setStoreCommission] = useState(5);
  const [selectedPricing, setSelectedPricing] = useState<'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual' | 'mercadolivre' | 'magalu'>('none');

  return {
    profitMargin,
    setProfitMargin,
    taxRate,
    setTaxRate,
    storeCommission,
    setStoreCommission,
    selectedPricing,
    setSelectedPricing
  };
}
