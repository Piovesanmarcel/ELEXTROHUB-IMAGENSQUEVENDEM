
import { LojaVirtualPricingInputs, LojaVirtualPricingResults } from "@/types/loja-virtual-pricing";

export const calculateLojaVirtualPricing = (inputs: LojaVirtualPricingInputs): LojaVirtualPricingResults => {
  const costPrice = parseFloat(inputs.costPrice) || 0;
  const commission = parseFloat(inputs.commission) || 0;
  const freight = parseFloat(inputs.freight) || 0;
  const profitMargin = parseFloat(inputs.profitMargin) || 0;
  const taxRate = parseFloat(inputs.taxRate) || 0;
  
  // Valor total com frete (base para cálculos)
  const totalWithFreight = costPrice + freight;
  
  // Cálculo do preço de venda considerando margem de lucro
  // Preço de venda = (Custo total) / (1 - margem% - comissão% - imposto%)
  const totalPercentages = (profitMargin + commission + taxRate) / 100;
  const sellingPrice = totalPercentages >= 1 ? 0 : totalWithFreight / (1 - totalPercentages);
  
  // Valores em reais
  const commissionValue = (sellingPrice * commission) / 100;
  const taxValue = (sellingPrice * taxRate) / 100;
  const totalCosts = totalWithFreight + commissionValue + taxValue;
  
  // Lucro final
  const finalProfit = sellingPrice - totalCosts;
  
  // Percentual de lucro sobre o preço de venda
  const profitPercentage = sellingPrice > 0 ? (finalProfit / sellingPrice) * 100 : 0;
  
  return {
    totalWithFreight,
    commissionValue,
    taxValue,
    totalCosts,
    sellingPrice,
    finalProfit,
    profitPercentage
  };
};
