export interface MercadoLivrePricingInputs {
    costPrice: string;
    taxRate: string;
    profitMargin: string;
    freeShipping: boolean;
    productWeight: string;
    shippingMode: 'mercado_envios' | 'seller_shipping' | 'pickup_only';
    includeShippingInPrice: boolean;
    estimatedShippingCost: string;
}

export interface MercadoLivrePricingResults {
    classicPrice: number;
    premiumPrice: number;
    classic: {
        finalPrice: number;
        categoryCommissionValue: number;
        fixedFeeValue: number;
        taxValue: number;
        shippingCostValue: number;
        totalDeductions: number;
        netRevenue: number;
        actualProfit: number;
        actualProfitMargin: number;
        qualifiesForFreeShipping: boolean;
    };
    premium: {
        finalPrice: number;
        categoryCommissionValue: number;
        fixedFeeValue: number;
        taxValue: number;
        shippingCostValue: number;
        totalDeductions: number;
        netRevenue: number;
        actualProfit: number;
        actualProfitMargin: number;
        qualifiesForFreeShipping: boolean;
    };
    shippingInfo: {
        mode: string;
        cost: number;
        includedInPrice: boolean;
    };
}

export const MERCADOLIVRE_FIXED_FEE = 6.50;
export const MERCADOLIVRE_LISTING_FEES = { classic: 11.5, premium: 16.5 };
export const FREE_SHIPPING_THRESHOLD = 79.90;

export const SHIPPING_ESTIMATES = {
    mercado_envios: {
        ranges: [
            { maxWeight: 300, baseCost: 12.90 },
            { maxWeight: 500, baseCost: 15.90 },
            { maxWeight: 1000, baseCost: 18.90 },
            { maxWeight: 2000, baseCost: 24.90 },
            { maxWeight: 5000, baseCost: 32.90 },
            { maxWeight: 10000, baseCost: 45.90 },
            { maxWeight: Infinity, baseCost: 65.90 }
        ]
    }
};

export const SHIPPING_MODES = {
    mercado_envios: 'Mercado Envios',
    seller_shipping: 'Frete por Conta do Vendedor',
    pickup_only: 'Retirada no Local'
};
