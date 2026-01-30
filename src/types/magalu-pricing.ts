export interface MagaluPricingInputs {
    costPrice: string;
    taxRate: string;
    profitMargin: string;
    freeShipping: boolean;
    productWeight: string;
    shippingMode: string;
    includeShippingInPrice: boolean;
    estimatedShippingCost: string;
}

export interface MagaluPricingResults {
    finalPrice: number;
    totalCosts: number;
    totalCommission: number;
    fixedFee: number;
    netProfit: number;
    profitPercentage: number;
    shippingCost: number;
    taxAmount: number;
    breakdownMessage: string;
    actualProfit: number;
    actualProfitMargin: number;
}
