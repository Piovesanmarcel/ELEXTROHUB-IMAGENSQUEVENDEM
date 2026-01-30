
import { Button } from "@/components/ui/button";
import { Calculator, Store, Truck, Package, Zap, Gift, ShoppingBag } from "lucide-react";

interface PricingSelectorProps {
  selectedPricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual' | 'mercadolivre' | 'magalu';
  onPricingChange: (pricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual' | 'mercadolivre' | 'magalu') => void;
}

const PricingSelector = ({ selectedPricing, onPricingChange }: PricingSelectorProps) => {
  const marketplaces = [
    { id: 'none', name: 'Padrão', icon: Store, color: 'default' },
    { id: 'mercadolivre', name: 'Mercado Livre', icon: ShoppingBag, color: 'yellow' },
    { id: 'magalu', name: 'Magalu', icon: Package, color: 'cyan' },
    { id: 'shopee', name: 'Shopee', icon: Calculator, color: 'green' },
    { id: 'shein', name: 'Shein', icon: Gift, color: 'pink' },
    { id: 'kwai', name: 'Kwai', icon: Zap, color: 'yellow' },
    { id: 'amazon', name: 'Amazon', icon: Truck, color: 'orange' },
    { id: 'tiktok', name: 'TikTok Shop', icon: Calculator, color: 'red' },
    { id: 'loja-virtual', name: 'Loja Virtual', icon: ShoppingBag, color: 'purple' }
  ];

  const getButtonClasses = (marketplaceId: string, color: string) => {
    const isSelected = selectedPricing === marketplaceId;

    const colorClasses: Record<string, string> = {
      default: isSelected ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50',
      green: isSelected ? 'bg-green-100 border-green-300 text-green-800' : 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
      purple: isSelected ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
      pink: isSelected ? 'bg-pink-100 border-pink-300 text-pink-800' : 'bg-pink-50 border-pink-200 hover:bg-pink-100 text-pink-700',
      yellow: isSelected ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-700',
      cyan: isSelected ? 'bg-cyan-100 border-cyan-300 text-cyan-800' : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-700',
      orange: isSelected ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700',
      red: isSelected ? 'bg-red-100 border-red-300 text-red-800' : 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700'
    };

    return colorClasses[color] || colorClasses.default;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {marketplaces.map((marketplace) => {
        const IconComponent = marketplace.icon;
        return (
          <Button
            key={marketplace.id}
            variant="outline"
            size="sm"
            onClick={() => onPricingChange(marketplace.id as any)}
            className={`flex items-center gap-2 h-auto p-3 ${getButtonClasses(marketplace.id, marketplace.color)}`}
          >
            <IconComponent className="h-4 w-4" />
            <span className="text-xs font-medium">{marketplace.name}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default PricingSelector;
