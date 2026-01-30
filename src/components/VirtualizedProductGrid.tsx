import { memo, useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Product } from "@/lib/supabase";
import { ProductGridItem } from './ProductGrid';

interface VirtualizedProductGridProps {
  products: Product[];
  enableVirtualization?: boolean;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
}

export const VirtualizedProductGrid = memo(({
  products,
  enableVirtualization = true,
  onEditProduct,
  onViewProduct
}: VirtualizedProductGridProps) => {
  
  // Calcular dimensões do grid
  const { columnCount, columnWidth, rowHeight } = useMemo(() => {
    const width = window.innerWidth;
    let cols = 1;
    
    if (width >= 1536) cols = 5; // 2xl
    else if (width >= 1280) cols = 4; // xl
    else if (width >= 1024) cols = 3; // lg
    else if (width >= 768) cols = 2; // md
    
    const gap = 24; // gap-6 = 24px
    const containerPadding = 48; // padding dos lados
    const availableWidth = width - containerPadding;
    const colWidth = (availableWidth - (gap * (cols - 1))) / cols;
    const rowH = 420; // altura aproximada do card
    
    return {
      columnCount: cols,
      columnWidth: colWidth,
      rowHeight: rowH
    };
  }, []);

  const rowCount = Math.ceil(products.length / columnCount);

  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }, []);

  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0) return { color: "destructive", text: "Sem estoque" };
    if (stock < 10) return { color: "secondary", text: "Estoque baixo" };
    return { color: "default", text: "Em estoque" };
  }, []);

  // Renderizar célula do grid
  const Cell = useCallback(({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= products.length) return null;

    const product = products[index];
    
    return (
      <div style={{
        ...style,
        padding: '12px',
        boxSizing: 'border-box'
      }}>
        <ProductGridItem
          product={product}
          onEditProduct={() => onEditProduct(product)}
          onViewProduct={() => onViewProduct(product)}
          formatPrice={formatPrice}
          getStockStatus={getStockStatus}
        />
      </div>
    );
  }, [products, columnCount, onEditProduct, onViewProduct, formatPrice, getStockStatus]);

  // Se virtualização desabilitada ou poucos produtos, usar grid normal
  if (!enableVirtualization || products.length < 50) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <ProductGridItem
            key={product.id}
            product={product}
            onEditProduct={() => onEditProduct(product)}
            onViewProduct={() => onViewProduct(product)}
            formatPrice={formatPrice}
            getStockStatus={getStockStatus}
          />
        ))}
      </div>
    );
  }

  // Grid virtualizado para listas grandes
  return (
    <Grid
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={Math.min(rowCount * rowHeight, window.innerHeight * 2)}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={window.innerWidth - 48}
      className="mx-auto"
    >
      {Cell}
    </Grid>
  );
});

VirtualizedProductGrid.displayName = 'VirtualizedProductGrid';
