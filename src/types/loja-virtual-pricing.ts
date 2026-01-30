
export interface LojaVirtualPricingInputs {
  costPrice: string;
  commission: string; // Comissão da loja (%)
  freight: string;
  profitMargin: string; // Margem de lucro (%)
  taxRate: string; // Taxa de imposto (%)
}

export interface LojaVirtualPricingResults {
  totalWithFreight: number;
  commissionValue: number;
  taxValue: number;
  totalCosts: number;
  sellingPrice: number;
  finalProfit: number;
  profitPercentage: number;
}
