import { type MercadoLivrePricingInputs, type MercadoLivrePricingResults, MERCADOLIVRE_FIXED_FEE, MERCADOLIVRE_LISTING_FEES, FREE_SHIPPING_THRESHOLD, SHIPPING_ESTIMATES } from "@/types/mercadolivre-pricing";

export const calculateShippingCost = (weight: number, shippingMode: string): number => {
    if (shippingMode === 'pickup_only') return 0;
    if (shippingMode === 'seller_shipping') return 0;

    const ranges = SHIPPING_ESTIMATES.mercado_envios.ranges;
    const range = ranges.find(r => weight <= r.maxWeight);
    return range ? range.baseCost : ranges[ranges.length - 1].baseCost;
};

const calculateListingPrice = (
    inputs: MercadoLivrePricingInputs,
    listingType: 'classic' | 'premium',
    isBreakeven: boolean = false
) => {
    const cost = parseFloat(inputs.costPrice) || 0;
    const tax = parseFloat(inputs.taxRate) || 0;
    const profit = isBreakeven ? 0 : parseFloat(inputs.profitMargin) || 0;
    const weight = parseFloat(inputs.productWeight) || 0;

    const listingCommission = MERCADOLIVRE_LISTING_FEES[listingType] / 100;
    const fixedFee = MERCADOLIVRE_FIXED_FEE;

    let shippingCost = 0;
    if (inputs.shippingMode === 'seller_shipping' && inputs.estimatedShippingCost) {
        shippingCost = parseFloat(inputs.estimatedShippingCost) || 0;
    } else if (inputs.shippingMode === 'mercado_envios') {
        shippingCost = calculateShippingCost(weight, inputs.shippingMode);
    }

    const additionalCosts = inputs.includeShippingInPrice ? shippingCost : 0;
    const profitMarginDecimal = profit / 100;
    const taxRateDecimal = tax / 100;

    const fixedCosts = fixedFee + additionalCosts;
    const percentualDeductions = profitMarginDecimal + taxRateDecimal + listingCommission;

    const denominator = 1 - percentualDeductions;
    const finalPrice = (cost + fixedCosts) / denominator;
    const qualifiesForFreeShipping = finalPrice >= FREE_SHIPPING_THRESHOLD;

    const categoryCommissionValue = finalPrice * listingCommission;
    const taxValue = finalPrice * taxRateDecimal;
    const shippingCostValue = inputs.includeShippingInPrice ? shippingCost : 0;
    const totalDeductions = categoryCommissionValue + fixedFee + taxValue + shippingCostValue;
    const netRevenue = finalPrice - totalDeductions;
    const actualProfit = netRevenue - cost;
    const actualProfitMargin = cost > 0 ? (actualProfit / cost) * 100 : 0;

    return {
        finalPrice,
        categoryCommissionValue,
        fixedFeeValue: fixedFee,
        taxValue,
        shippingCostValue,
        totalDeductions,
        netRevenue,
        actualProfit,
        actualProfitMargin,
        qualifiesForFreeShipping
    };
};

export const calculateMercadoLivrePricing = (inputs: MercadoLivrePricingInputs): MercadoLivrePricingResults => {
    const weight = parseFloat(inputs.productWeight) || 0;
    let shippingCost = 0;
    if (inputs.shippingMode === 'seller_shipping' && inputs.estimatedShippingCost) {
        shippingCost = parseFloat(inputs.estimatedShippingCost) || 0;
    } else if (inputs.shippingMode === 'mercado_envios') {
        shippingCost = calculateShippingCost(weight, inputs.shippingMode);
    }

    const classic = calculateListingPrice(inputs, 'classic');
    const premium = calculateListingPrice(inputs, 'premium');

    return {
        classicPrice: classic.finalPrice,
        premiumPrice: premium.finalPrice,
        classic,
        premium,
        shippingInfo: {
            mode: inputs.shippingMode,
            cost: shippingCost,
            includedInPrice: inputs.includeShippingInPrice
        }
    };
};

export const calculateMercadoLivreBreakeven = (inputs: MercadoLivrePricingInputs): MercadoLivrePricingResults => {
    // Same logic but with isBreakeven = true
    const weight = parseFloat(inputs.productWeight) || 0;
    let shippingCost = 0;
    if (inputs.shippingMode === 'seller_shipping' && inputs.estimatedShippingCost) {
        shippingCost = parseFloat(inputs.estimatedShippingCost) || 0;
    } else if (inputs.shippingMode === 'mercado_envios') {
        shippingCost = calculateShippingCost(weight, inputs.shippingMode);
    }

    const classic = calculateListingPrice(inputs, 'classic', true);
    const premium = calculateListingPrice(inputs, 'premium', true);

    return {
        classicPrice: classic.finalPrice,
        premiumPrice: premium.finalPrice,
        classic,
        premium,
        shippingInfo: {
            mode: inputs.shippingMode,
            cost: shippingCost,
            includedInPrice: inputs.includeShippingInPrice
        }
    };
};

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
};
