
import { Product } from "@/lib/supabase";

export interface ProductTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  updateSingleProduct?: (product: Product) => void;
  profitMargin: number | '';
  taxRate: number | '';
  selectedPricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual';
}

export interface StockDisplay {
  value: string;
  className: string;
  isSynced?: boolean;
}

export interface MarketplaceCalculation {
  finalPrice: number;
  actualProfit: number;
  actualProfitMargin: number;
  taxValue?: number;
}
