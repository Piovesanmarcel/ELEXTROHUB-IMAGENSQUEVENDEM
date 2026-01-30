
import { AmazonPricingInputs, AmazonPricingResults } from "@/types/amazon-pricing";

export const calculateAmazonPricing = (inputs: AmazonPricingInputs, commissionRate: number = 0.115): AmazonPricingResults => {
  const cost = parseFloat(inputs.costPrice) || 0;
  const tax = parseFloat(inputs.taxRate) || 0;
  const profit = parseFloat(inputs.profitMargin) || 0;
  const shippingCost = parseFloat(inputs.estimatedShippingCost) || 0;

  // Taxas da Amazon
  const fixedFee = 5.00; // R$ 5,00 por item (taxa de referência)

  // Cálculo do preço de venda
  const profitMarginDecimal = profit / 100;
  const taxRateDecimal = tax / 100;
  
  const denominator = 1 - profitMarginDecimal - taxRateDecimal - commissionRate;
  let finalPrice = (cost + fixedFee) / denominator;

  // Adicionar frete no preço se necessário
  if (inputs.includeShippingInPrice && !inputs.freeShipping) {
    finalPrice += shippingCost;
  }

  // Cálculos detalhados
  const totalCommission = finalPrice * commissionRate;
  const taxAmount = finalPrice * taxRateDecimal;
  const totalCosts = cost + fixedFee + totalCommission + taxAmount;
  const netProfit = finalPrice - totalCosts;
  const profitPercentage = cost > 0 ? (netProfit / cost) * 100 : 0;

  const breakdownMessage = `Preço final: R$ ${finalPrice.toFixed(2)} | Comissão: R$ ${totalCommission.toFixed(2)} | Taxa fixa: R$ ${fixedFee.toFixed(2)} | Impostos: R$ ${taxAmount.toFixed(2)} | Lucro líquido: R$ ${netProfit.toFixed(2)}`;

  return {
    finalPrice,
    totalCosts,
    totalCommission,
    fixedFee,
    netProfit,
    profitPercentage,
    shippingCost: inputs.freeShipping ? 0 : shippingCost,
    taxAmount,
    breakdownMessage,
    actualProfit: netProfit,
    actualProfitMargin: profitPercentage
  };
};

export const calculateAmazonBreakeven = (inputs: AmazonPricingInputs, commissionRate: number = 0.115): AmazonPricingResults => {
  const cost = parseFloat(inputs.costPrice) || 0;
  const tax = parseFloat(inputs.taxRate) || 0;
  const shippingCost = parseFloat(inputs.estimatedShippingCost) || 0;

  // Taxas da Amazon
  const fixedFee = 5.00; // R$ 5,00 por item (taxa de referência)

  // Cálculo do preço de breakeven (margem 0%)
  const taxRateDecimal = tax / 100;
  
  const denominator = 1 - taxRateDecimal - commissionRate;
  let finalPrice = (cost + fixedFee) / denominator;

  // Adicionar frete no preço se necessário
  if (inputs.includeShippingInPrice && !inputs.freeShipping) {
    finalPrice += shippingCost;
  }

  // Cálculos detalhados
  const totalCommission = finalPrice * commissionRate;
  const taxAmount = finalPrice * taxRateDecimal;
  const totalCosts = cost + fixedFee + totalCommission + taxAmount;
  const netProfit = finalPrice - totalCosts;
  const profitPercentage = 0; // Breakeven sempre 0%

  const breakdownMessage = `Breakeven - Preço mínimo: R$ ${finalPrice.toFixed(2)} | Comissão: R$ ${totalCommission.toFixed(2)} | Taxa fixa: R$ ${fixedFee.toFixed(2)} | Impostos: R$ ${taxAmount.toFixed(2)}`;

  return {
    finalPrice,
    totalCosts,
    totalCommission,
    fixedFee,
    netProfit,
    profitPercentage,
    shippingCost: inputs.freeShipping ? 0 : shippingCost,
    taxAmount,
    breakdownMessage,
    actualProfit: netProfit,
    actualProfitMargin: profitPercentage
  };
};
