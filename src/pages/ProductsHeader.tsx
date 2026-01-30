
interface ProductsHeaderProps {
  allProductsCount: number;
}

export function ProductsHeader({ allProductsCount }: ProductsHeaderProps) {
  return (
    <div className="flex flex-col">
      <h1 className="text-4xl font-bold gradient-text">Produtos</h1>
      <p className="text-muted-foreground">
        Gerencie seu catálogo de produtos com precificação automática 
        {allProductsCount > 0 && (
          <span className="ml-2 font-medium">
            ({allProductsCount.toLocaleString()} produtos no total)
          </span>
        )}
      </p>
    </div>
  );
}
