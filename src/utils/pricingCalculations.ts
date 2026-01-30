

import { type PricingInputs, type PricingResults } from "@/types/pricing";

export const calculatePricing = (inputs: PricingInputs): PricingResults => {
  const cost = parseFloat(inputs.costPrice) || 0;
  const tax = parseFloat(inputs.taxRate) || 0;
  const profit = parseFloat(inputs.profitMargin) || 0;

  // Taxas da Shopee
  const standardCommission = 0.14; // 14%
  const freeShippingCommission = 0.06; // 6%
  const itemFee = 4.0; // R$ 4,00 por item

  // Cálculo do preço de venda usando fórmula EXATA do Excel
  let totalCommissionRate = standardCommission;
  if (inputs.freeShipping) {
    totalCommissionRate += freeShippingCommission;
  }

  // Fórmula EXATA do Excel: 
  // (CUSTO DO PRODUTO+FIXO R$4)/(1-MARGEM DE 30%-IMPOSTO 4%-COMISSÃO DE 20%)
  const profitMarginDecimal = profit / 100;
  const taxRateDecimal = tax / 100;
  
  const denominator = 1 - profitMarginDecimal - taxRateDecimal - totalCommissionRate;
  const finalPrice = (cost + itemFee) / denominator;

  // Cálculos detalhados para exibição
  const standardCommissionValue = finalPrice * standardCommission;
  const freeShippingCommissionValue = inputs.freeShipping ? finalPrice * freeShippingCommission : 0;
  const taxValue = finalPrice * taxRateDecimal;
  const totalDeductions = standardCommissionValue + freeShippingCommissionValue + itemFee + taxValue;
  const netRevenue = finalPrice - totalDeductions;
  const actualProfit = netRevenue - cost;
  const actualProfitMargin = cost > 0 ? (actualProfit / cost) * 100 : 0;

  return {
    finalPrice,
    standardCommissionValue,
    freeShippingCommissionValue,
    itemFee,
    taxValue,
    totalDeductions,
    netRevenue,
    actualProfit,
    actualProfitMargin
  };
};

export const calculateBreakeven = (inputs: PricingInputs): PricingResults => {
  const cost = parseFloat(inputs.costPrice) || 0;
  const tax = parseFloat(inputs.taxRate) || 0;

  // Taxas da Shopee
  const standardCommission = 0.14; // 14%
  const freeShippingCommission = 0.06; // 6%
  const itemFee = 4.0; // R$ 4,00 por item

  let totalCommissionRate = standardCommission;
  if (inputs.freeShipping) {
    totalCommissionRate += freeShippingCommission;
  }

  // Breakeven: margem de lucro = 0%
  const taxRateDecimal = tax / 100;
  
  const denominator = 1 - 0 - taxRateDecimal - totalCommissionRate; // Margem = 0%
  const finalPrice = (cost + itemFee) / denominator;

  // Cálculos detalhados para exibição
  const standardCommissionValue = finalPrice * standardCommission;
  const freeShippingCommissionValue = inputs.freeShipping ? finalPrice * freeShippingCommission : 0;
  const taxValue = finalPrice * taxRateDecimal;
  const totalDeductions = standardCommissionValue + freeShippingCommissionValue + itemFee + taxValue;
  const netRevenue = finalPrice - totalDeductions;
  const actualProfit = netRevenue - cost;
  const actualProfitMargin = 0; // Breakeven = 0% de lucro

  return {
    finalPrice,
    standardCommissionValue,
    freeShippingCommissionValue,
    itemFee,
    taxValue,
    totalDeductions,
    netRevenue,
    actualProfit,
    actualProfitMargin
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

