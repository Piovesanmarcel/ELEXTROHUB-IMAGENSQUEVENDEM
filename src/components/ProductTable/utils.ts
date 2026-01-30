
import { Product } from "@/lib/supabase";
import { PricingInputs } from "@/types/pricing";
import { calculatePricing } from "@/utils/pricingCalculations";
import { calculateSheinPricing } from "@/utils/sheinPricingCalculations";
import { calculateKwaiPricing } from "@/utils/kwaiPricingCalculations";
import { calculateAmazonPricing } from "@/utils/amazonPricingCalculations";
import { calculateTikTokPricing } from "@/utils/tiktokPricingCalculations";
import { calculateMercadoLivrePricing } from "@/utils/mercadolivrePricingCalculations";
import { calculateMagaluPricing } from "@/utils/magaluPricingCalculations";
import { StockDisplay, MarketplaceCalculation } from "./types";

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
};

export const getStockDisplay = (
  stock: number,
  estoqueSincronizadoEm?: string | null
): StockDisplay => {
  // Estoque sincronizado = cor CIANO especial com ícone
  if (estoqueSincronizadoEm) {
    if (stock === 0) {
      return {
        value: "0",
        className: "text-cyan-600 font-bold bg-cyan-50 px-2 py-1 rounded-md border border-cyan-200",
        isSynced: true
      };
    }
    if (stock < 10) {
      return {
        value: stock.toString(),
        className: "text-cyan-600 font-bold bg-cyan-50 px-2 py-1 rounded-md border border-cyan-200",
        isSynced: true
      };
    }
    return {
      value: stock.toString(),
      className: "text-cyan-600 font-bold bg-cyan-50 px-2 py-1 rounded-md border border-cyan-200",
      isSynced: true
    };
  }

  // Lógica existente para estoques não sincronizados
  if (stock === 0) {
    return {
      value: "0",
      className: "text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md"
    };
  }
  if (stock < 10) {
    return {
      value: stock.toString(),
      className: "text-yellow-600 font-bold bg-yellow-50 px-2 py-1 rounded-md"
    };
  }
  return {
    value: stock.toString(),
    className: "text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md"
  };
};

export const calculateMarketplacePricing = (
  product: Product,
  selectedPricing: string,
  profitMargin: number,
  taxRate: number
): MarketplaceCalculation | null => {
  if (!product.preco_custo) return null;

  const productWeight = product.peso_bruto ? product.peso_bruto * 1000 : 300;

  const baseInputs = {
    costPrice: product.preco_custo.toString(),
    taxRate: taxRate.toString(),
    profitMargin: profitMargin.toString(),
    freeShipping: true,
    productWeight: productWeight.toString(),
    shippingMode: 'standard',
    includeShippingInPrice: false,
    estimatedShippingCost: "15.00"
  };

  switch (selectedPricing) {
    case 'shopee':
      const shopeeInputs: PricingInputs = {
        costPrice: product.preco_custo.toString(),
        taxRate: taxRate.toString(),
        profitMargin: profitMargin.toString(),
        freeShipping: true
      };
      return calculatePricing(shopeeInputs);
    case 'shein':
      return calculateSheinPricing(baseInputs);
    case 'kwai':
      return calculateKwaiPricing(baseInputs);
    case 'amazon':
      const amazonInputs = {
        ...baseInputs,
        category: 'electronics'
      };
      return calculateAmazonPricing(amazonInputs);
    case 'tiktok':
      return calculateTikTokPricing(baseInputs);
    case 'mercadolivre':
      // MercadoLivre returns { classic, premium, ... } but we need to map it to MarketplaceCalculation interface
      // We'll prioritize the Classic price for the table view
      const mlResult = calculateMercadoLivrePricing({
        ...baseInputs,
        shippingMode: 'mercado_envios'
      });
      return {
        finalPrice: mlResult.classicPrice,
        actualProfit: mlResult.classic.actualProfit,
        actualProfitMargin: mlResult.classic.actualProfitMargin,
        taxValue: mlResult.classic.taxValue
      };
    case 'magalu':
      const magaluResult = calculateMagaluPricing({
        ...baseInputs,
        shippingMode: 'magalu_envios',
        estimatedShippingCost: "12.50" // Default estimate
      });
      return {
        finalPrice: magaluResult.finalPrice,
        actualProfit: magaluResult.actualProfit,
        actualProfitMargin: magaluResult.actualProfitMargin,
        taxValue: magaluResult.taxAmount
      };
    default:
      return null;
  }
};

export const getMarketplaceColor = (selectedPricing: string) => {
  const colors: Record<string, string> = {
    shopee: 'green',
    shein: 'pink',
    kwai: 'yellow',
    amazon: 'orange',
    tiktok: 'red',
    mercadolivre: 'yellow',
    magalu: 'cyan'
  };
  return colors[selectedPricing] || 'blue';
};
