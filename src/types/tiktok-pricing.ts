
export interface TiktokPricingInputs {
  costPrice: string;
  taxRate: string;
  profitMargin: string;
  freeShipping: boolean;
  productWeight: string;
  shippingMode: string;
  includeShippingInPrice: boolean;
  estimatedShippingCost: string;
}

export interface TiktokPricingResults {
  finalPrice: number;
  totalCosts: number;
  totalCommission: number;
  fixedFee: number;
  netProfit: number;
  profitPercentage: number;
  shippingCost: number;
  taxAmount: number;
  paymentFee: number;
  breakdownMessage: string;
  // Add missing properties for consistency with ProductTable
  actualProfit: number;
  actualProfitMargin: number;
}
