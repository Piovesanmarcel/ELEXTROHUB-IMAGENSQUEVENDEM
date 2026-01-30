
import { memo } from "react";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ProductTableProps } from "./ProductTable/types";
import { TableHeaders } from "./ProductTable/TableHeaders";
import { ProductRow } from "./ProductTable/ProductRow";

export const ProductTable = memo(function ProductTable({
  products, 
  onEditProduct, 
  onViewProduct,
  updateSingleProduct,
  profitMargin, 
  taxRate,
  selectedPricing,
  storeCommission = 5
}: ProductTableProps & { storeCommission?: number }) {
  return (
    <div className="rounded-lg border glass-effect overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaders selectedPricing={selectedPricing} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onEditProduct={onEditProduct}
              onViewProduct={onViewProduct}
              updateSingleProduct={updateSingleProduct}
              selectedPricing={selectedPricing}
              profitMargin={profitMargin}
              taxRate={taxRate}
              storeCommission={storeCommission}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
