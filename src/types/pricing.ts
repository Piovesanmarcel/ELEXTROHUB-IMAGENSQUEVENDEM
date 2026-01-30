
export interface PricingInputs {
  costPrice: string;
  taxRate: string;
  profitMargin: string;
  freeShipping: boolean;
}

export interface PricingResults {
  finalPrice: number;
  standardCommissionValue: number;
  freeShippingCommissionValue: number;
  itemFee: number;
  taxValue: number;
  totalDeductions: number;
  netRevenue: number;
  actualProfit: number;
  actualProfitMargin: number;
}
