import { MagaluPricingInputs, MagaluPricingResults } from "@/types/magalu-pricing";

// Tabela de frete Magalu com 50% de coparticipação já aplicada
const getShippingCostByWeight = (weightInGrams: number): number => {
    if (weightInGrams <= 500) return 17.95;
    if (weightInGrams <= 1000) return 20.45;
    if (weightInGrams <= 2000) return 21.45;
    if (weightInGrams <= 5000) return 25.45;
    if (weightInGrams <= 9000) return 38.95;
    if (weightInGrams <= 13000) return 49.45;
    if (weightInGrams <= 17000) return 55.95;
    if (weightInGrams <= 23000) return 55.95;
    if (weightInGrams <= 30000) return 67.45;
    if (weightInGrams <= 40000) return 74.45;
    if (weightInGrams <= 50000) return 79.95;
    if (weightInGrams <= 60000) return 98.95;
    return 98.95;
};

export const calculateMagaluPricing = (inputs: MagaluPricingInputs, commissionRate: number = 0.18): MagaluPricingResults => {
    const cost = parseFloat(inputs.costPrice) || 0;
    const tax = parseFloat(inputs.taxRate) || 0;
    const profit = parseFloat(inputs.profitMargin) || 0;
    const productWeight = parseFloat(inputs.productWeight) || 300;

    const fixedFee = 5.00;
    const commission = commissionRate;
    const shippingCost = inputs.freeShipping ? 0 : getShippingCostByWeight(productWeight);

    const profitMarginDecimal = profit / 100;
    const taxRateDecimal = tax / 100;

    const denominator = 1 - profitMarginDecimal - taxRateDecimal - commission;
    let finalPrice = (cost + fixedFee) / denominator;

    if (finalPrice > 79 && !inputs.freeShipping) {
        finalPrice += shippingCost;
    }

    const totalCommission = finalPrice * commission;
    const taxAmount = finalPrice * taxRateDecimal;
    const totalCosts = cost + fixedFee + totalCommission + taxAmount;
    const netProfit = finalPrice - totalCosts;
    const profitPercentage = cost > 0 ? (netProfit / cost) * 100 : 0;

    const breakdownMessage = `Preço final: R$ ${finalPrice.toFixed(2)} | Comissão: R$ ${totalCommission.toFixed(2)} | Custo fixo: R$ ${fixedFee.toFixed(2)} | Impostos: R$ ${taxAmount.toFixed(2)} | Frete: R$ ${shippingCost.toFixed(2)} | Lucro líquido: R$ ${netProfit.toFixed(2)}`;

    return {
        finalPrice,
        totalCosts,
        totalCommission,
        fixedFee,
        netProfit,
        profitPercentage,
        shippingCost: finalPrice > 79 && !inputs.freeShipping ? shippingCost : 0,
        taxAmount,
        breakdownMessage,
        actualProfit: netProfit,
        actualProfitMargin: profitPercentage
    };
};

export const calculateMagaluBreakeven = (inputs: MagaluPricingInputs, commissionRate: number = 0.18): MagaluPricingResults => {
    const cost = parseFloat(inputs.costPrice) || 0;
    const tax = parseFloat(inputs.taxRate) || 0;
    const productWeight = parseFloat(inputs.productWeight) || 300;

    const fixedFee = 5.00;
    const commission = commissionRate;
    const shippingCost = inputs.freeShipping ? 0 : getShippingCostByWeight(productWeight);

    const taxRateDecimal = tax / 100;
    const denominator = 1 - taxRateDecimal - commission;
    let finalPrice = (cost + fixedFee) / denominator;

    if (finalPrice > 79 && !inputs.freeShipping) {
        finalPrice += shippingCost;
    }

    const totalCommission = finalPrice * commission;
    const taxAmount = finalPrice * taxRateDecimal;
    const totalCosts = cost + fixedFee + totalCommission + taxAmount;
    const netProfit = finalPrice - totalCosts;
    const profitPercentage = 0;

    const breakdownMessage = `Breakeven - Preço mínimo: R$ ${finalPrice.toFixed(2)} | Comissão: R$ ${totalCommission.toFixed(2)} | Custo fixo: R$ ${fixedFee.toFixed(2)} | Impostos: R$ ${taxAmount.toFixed(2)} | Frete: R$ ${shippingCost.toFixed(2)}`;

    return {
        finalPrice,
        totalCosts,
        totalCommission,
        fixedFee,
        netProfit,
        profitPercentage,
        shippingCost: finalPrice > 79 && !inputs.freeShipping ? shippingCost : 0,
        taxAmount,
        breakdownMessage,
        actualProfit: netProfit,
        actualProfitMargin: profitPercentage
    };
};
