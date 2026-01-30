
export interface AmazonPricingInputs {
  costPrice: string;
  taxRate: string;
  profitMargin: string;
  freeShipping: boolean;
  productWeight: string;
  shippingMode: string;
  includeShippingInPrice: boolean;
  estimatedShippingCost: string;
  category: string;
}

export interface AmazonPricingResults {
  finalPrice: number;
  totalCosts: number;
  totalCommission: number;
  fixedFee: number;
  netProfit: number;
  profitPercentage: number;
  shippingCost: number;
  taxAmount: number;
  breakdownMessage: string;
  // Add missing properties for consistency with ProductTable
  actualProfit: number;
  actualProfitMargin: number;
}
