import { Store, ShoppingBag, Package, ShoppingCart } from 'lucide-react';

const MarketplaceCards = () => {
  const marketplaces = [
    { 
      name: 'Mercado Livre', 
      icon: ShoppingBag,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    { 
      name: 'Amazon', 
      icon: Package,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    { 
      name: 'Magalu', 
      icon: Store,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      name: 'Shopee', 
      icon: ShoppingCart,
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-sm text-muted-foreground font-medium">
        Perfeito para vender em:
      </span>
      <div className="flex flex-wrap justify-center gap-3">
        {marketplaces.map((mp) => (
          <div 
            key={mp.name} 
            className="relative flex items-center gap-3 px-4 py-2.5 bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
            style={{ borderColor: `hsl(var(--border))` }}
          >
            <div className={`w-9 h-9 rounded-lg ${mp.bgColor} flex items-center justify-center`}>
              <mp.icon className={`w-4.5 h-4.5 ${mp.iconColor}`} />
            </div>
            <span className="font-semibold text-sm text-foreground">{mp.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketplaceCards;
